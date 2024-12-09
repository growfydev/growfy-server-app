import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import {
	GlobalStatus,
	Post,
	PostStatus,
	Profile,
	TaskStatus,
} from '@prisma/client';
import { Service } from 'src/service';
import { ExportPostsDto } from './dtos/export-posts.dto';
import { ExportFactory } from './exporter/export.factory';
import { PostFactorySelector } from './factories/common/post-factory/post.selector.factory';

@Injectable()
export class PostsService extends Service {
	constructor(
		private readonly prisma: PrismaService,
		private readonly taskQueueService: TaskQueueService,
	) {
		super(PostsService.name);
	}

	async createPost(
		postData: CreatePostDto,
		profileId: number,
	): Promise<Post> {
		const { typePost, provider, content, unix } = postData;

		const postType = await this.prisma.postType.findUnique({
			where: { id: typePost },
		});
		if (!postType) {
			throw new Error(`Post type "${typePost}" not found.`);
		}

		const providerData = await this.prisma.provider.findUnique({
			where: { id: provider },
		});
		if (!providerData) {
			throw new Error(`Provider "${provider}" not found.`);
		}

		const isValidProviderPostType =
			await this.prisma.providerPostType.findFirst({
				where: {
					providerId: providerData.id,
					posttypeId: postType.id,
				},
			});
		if (!isValidProviderPostType) {
			throw new Error(
				`The type of post "${typePost}" is not supported by the supplier "${provider}".`,
			);
		}

		const {
			characterLimit,
			characterKey,
			fields: requiredFields,
		} = isValidProviderPostType;
		if (!characterLimit || !characterKey) {
			throw new Error(
				`Character limit or characterKey is not set for provider "${provider}" and post type "${typePost}".`,
			);
		}

		// Acceder al valor usando characterKey (soporta anidación)
		const contentValue = characterKey
			.split('.')
			.reduce((obj, key) => obj && obj[key], content);

		if (typeof contentValue !== 'string') {
			throw new Error(
				`The content specified by "${characterKey}" must be a string.`,
			);
		}

		// Validar la longitud del contenido
		if (contentValue.length > characterLimit) {
			throw new Error(
				`The content exceeds the character limit for provider "${provider}". Maximum allowed: ${characterLimit}, current length: ${contentValue.length}.`,
			);
		}

		// Validación de campos requeridos
		for (const [field, fieldType] of Object.entries(
			requiredFields as Record<string, string>,
		)) {
			if (!(field in content)) {
				throw new Error(
					`The field "${field}" is required for the type of post "${typePost}".`,
				);
			}

			if (typeof content[field] !== fieldType) {
				throw new Error(
					`The field "${field}" must be of type "${fieldType}", but received "${typeof content[field]}".`,
				);
			}
		}

		if (!profileId) {
			throw new Error(
				`No profile associated with the provider "${provider}".`,
			);
		}

		const postStatus = unix ? PostStatus.QUEUED : PostStatus.PUBLISHED;
		const taskStatus = unix ? TaskStatus.PENDING : TaskStatus.COMPLETED;
		const unixCurrentTimestamp = Math.floor(new Date().getTime() / 1000);

		const newPost = await this.prisma.post.create({
			data: {
				status: postStatus,
				postTypeId: postType.id,
				providerPostTypeId: isValidProviderPostType.id,
				profileId,
				fields: content,
				globalStatus: GlobalStatus.ACTIVE,
				task: unix
					? { create: { status: taskStatus, unix } }
					: {
							create: {
								status: taskStatus,
								unix: unixCurrentTimestamp,
							},
						},
			},
			include: {
				ProviderPostType: {
					include: {
						provider: {
							select: { name: true },
						},
						posttype: {
							select: { name: true },
						},
					},
				},
				task: { select: { status: true, unix: true } },
			},
		});

		if (unix) {
			await this.taskQueueService.scheduleTask(
				profileId,
				newPost.id,
				unix,
			);
		}

		return newPost;
	}

	async getPostsByProfile(profileId: number): Promise<Profile> {
		return this.prisma.profile.findUnique({
			where: {
				id: profileId,
			},
			include: {
				posts: {
					include: {
						task: {
							select: {
								status: true,
								unix: true,
							},
						},
						ProviderPostType: {
							include: {
								provider: {
									select: {
										name: true,
									},
								},
								posttype: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
			},
		});
	}

	async publishPost(profileId: number, postId: number): Promise<void> {
		try {
			const post = await this.prisma.post.findUnique({
				where: {
					id: postId,
				},
				include: {
					profile: {
						select: {
							socials: {
								select: {
									providerId: true,
									access_token: true,
									accountId: true,
								},
							},
						},
					},
					ProviderPostType: {
						include: {
							provider: {
								select: {
									name: true,
									id: true,
								},
							},
							posttype: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			});

			if (!post || !post.ProviderPostType) {
				throw new Error('Post not found');
			}

			const typePostName = post.ProviderPostType.posttype.name;
			const provider = post.ProviderPostType.provider;
			const accountId = post.profile.socials.find(
				(social) => social.providerId === provider.id,
			).accountId;
			const token = post.profile.socials.find(
				(social) => social.providerId === provider.id,
			).access_token;
			const fields = post.fields;

			const factory = PostFactorySelector.getFactory(provider.name);
			const publisher = factory.createPublisher();
			await publisher.publish(typePostName, fields, { accountId, token });

			await this.update(profileId, postId);
		} catch (error) {
			await this.prisma.post.update({
				where: { id: postId },
				data: { status: PostStatus.FAILED },
			});

			await this.prisma.task.updateMany({
				where: { postId },
				data: { status: TaskStatus.FAILED },
			});

			this.logger.error(error);
		}
	}

	async update(profileId: number, postId: number): Promise<void> {
		const post = await this.prisma.post.findFirst({
			where: { id: postId, profileId },
			include: { task: true },
		});

		if (!post) {
			throw new Error(
				`Post with ID ${postId} not found for profile ${profileId}.`,
			);
		}

		await this.prisma.post.update({
			where: { id: postId },
			data: {
				globalStatus: GlobalStatus.ACTIVE,
				status: PostStatus.PUBLISHED,
			},
		});

		if (post.task) {
			await this.prisma.task.update({
				where: { id: post.task.id },
				data: { status: TaskStatus.COMPLETED },
			});
		}

		this.logger.log(`Post ${postId} has been published.`);
	}

	async exportPosts(
		profileId: number,
		exportPostsDto: ExportPostsDto,
	): Promise<{ fileBuffer: Buffer; header: { 'Content-Type': string } }> {
		const { startDate, endDate, providerIds, formatId } = exportPostsDto;

		const start = new Date(startDate);
		start.setUTCHours(0, 0, 0, 0);

		const end = new Date(endDate);
		end.setUTCHours(23, 59, 59, 999);

		const format = await this.prisma.exportFormat.findUnique({
			where: { id: formatId },
		});

		if (!format) {
			throw new Error('Formato no encontrado');
		}

		const posts = await this.prisma.post.findMany({
			where: {
				profileId,
				createdAt: {
					gte: start,
					lte: end,
				},

				...(providerIds !== undefined && providerIds.length > 0
					? { ProviderPostType: { providerId: { in: providerIds } } }
					: providerIds?.length === 0
						? { ProviderPostType: { providerId: { in: [] } } }
						: {}),
			},
			include: {
				ProviderPostType: {
					include: {
						provider: true,
						posttype: true,
					},
				},
				profile: true,
				task: true,
				PostType: true,
			},
		});

		if (!posts.length) {
			throw new Error(
				'No se encontraron publicaciones en el rango de fechas especificado.',
			);
		}

		// Transformar los posts a un formato más fácil de mapear y guardar
		const transformedPosts = posts.map((post) => ({
			id: post.id,
			content: post.fields,
			postTypeId: post.postTypeId,
			provider: post.ProviderPostType?.provider.name,
			postType: post.ProviderPostType?.posttype.name,
			profileName: post.profile?.name,
			taskStatus: post.task?.status,
			taskUnix: post.task?.unix,
		}));

		// Registrar la exportación con los datos transformados
		await this.prisma.export.create({
			data: {
				startDate: start,
				endDate: end,
				posts: transformedPosts, // Almacenar los datos de los posts de forma más estructurada
				format: format.format, // Almacenar el formato de exportación
			},
		});

		// Exportar según el formato
		const exporter = ExportFactory.getExporter(format.format);
		return exporter.export(posts);
	}
}
