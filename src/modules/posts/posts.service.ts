import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import {
	GlobalStatus,
	Post,
	PostStatus,
	Profile,
	TaskStatus,
	Prisma,
} from '@prisma/client';
import { Service } from 'src/service';
import { ExportPostsDto } from './dtos/export-posts.dto';
import { ExportFactory } from './exporter/export.factory';
import { PostFactorySelector } from './factories/common/post-factory/post.selector.factory';
import {
	DateRange,
	ExportFormatType,
	ExportResult,
	PostsIncludeClause,
	PostsIncludeQuery,
	PostsWhereClause,
	postType,
	PostWithIncludes,
	PostWithRelations,
	PostWithRelationsForExport,
	PostWithTask,
	providerData,
	providerPostType,
	ProviderPostTypeFields,
	PublishData,
	TaskFieldsSelect,
	TransformedPost,
} from './dtos/transformed-post.interface';

@Injectable()
export class PostsService extends Service {
	constructor(
		private readonly prisma: PrismaService,
		private readonly taskQueueService: TaskQueueService,
	) {
		super(PostsService.name);
	}

	/**
	 * Crea una nueva publicación con las validaciones necesarias.
	 * @param postData - DTO con los datos de la publicación.
	 * @param profileId - ID del perfil que crea la publicación.
	 * @returns La nueva publicación creada.
	 */

	async createPost(
		postData: CreatePostDto,
		profileId: number,
	): Promise<Post> {
		const { typePost, provider, content, unix } = postData;

		await this.validateProfile(profileId, provider);
		const postType = await this.getAndValidatePostType(typePost);
		const providerData = await this.getAndValidateProvider(provider);
		const providerPostType = await this.validateProviderPostType(
			providerData.id,
			postType.id,
			typePost,
			provider,
		);

		await this.validateContent(
			content,
			providerPostType,
			provider,
			typePost,
		);

		const newPost = await this.createPostRecord(
			postType,
			providerPostType,
			profileId,
			content,
			unix,
		);

		if (unix) {
			await this.taskQueueService.scheduleTask(
				profileId,
				newPost.id,
				unix,
			);
		}

		return newPost;
	}

	/**
	 * Valida que exista un perfil asociado al proveedor.
	 * @param profileId - ID del perfil a validar.
	 * @param provider - ID del proveedor.
	 */
	private async validateProfile(
		profileId: number,
		provider: number,
	): Promise<void> {
		if (!profileId) {
			throw new Error(
				`No hay perfil asociado con el proveedor "${provider}".`,
			);
		}
	}

	/**
	 * Busca y valida un tipo de publicación.
	 * @param typePost - ID del tipo de publicación.
	 * @returns El tipo de publicación encontrado.
	 */
	private async getAndValidatePostType(typePost: number): Promise<postType> {
		const postType = await this.prisma.postType.findUnique({
			where: { id: typePost },
		});
		if (!postType) {
			throw new Error(`Tipo de publicación "${typePost}" no encontrado.`);
		}
		return postType;
	}

	/**
	 * Busca y valida un proveedor.
	 * @param provider - ID del proveedor.
	 * @returns Los datos del proveedor encontrado.
	 */
	private async getAndValidateProvider(
		provider: number,
	): Promise<providerData> {
		const providerData = await this.prisma.provider.findUnique({
			where: { id: provider },
		});
		if (!providerData) {
			throw new Error(`Proveedor "${provider}" no encontrado.`);
		}
		return providerData;
	}

	/**
	 * Valida la relación entre proveedor y tipo de publicación.
	 * @param providerId - ID del proveedor.
	 * @param postTypeId - ID del tipo de publicación.
	 * @param typePost - Tipo de publicación original.
	 * @param provider - Proveedor original.
	 * @returns La relación proveedor-tipo validada.
	 */
	private async validateProviderPostType(
		providerId: number,
		postTypeId: number,
		typePost: number,
		provider: number,
	): Promise<providerPostType> {
		const providerPostType = await this.prisma.providerPostType.findFirst({
			where: {
				providerId,
				posttypeId: postTypeId,
			},
		});
		if (!providerPostType) {
			throw new Error(
				`El tipo de publicación "${typePost}" no está soportado por el proveedor "${provider}".`,
			);
		}
		return providerPostType;
	}

	/**
	 * Valida el contenido de la publicación.
	 * @param content - Contenido a validar.
	 * @param providerPostType - Tipo de publicación del proveedor.
	 * @param provider - ID del proveedor.
	 * @param typePost - ID del tipo de publicación.
	 */
	private async validateContent(
		content: any,
		providerPostType: any,
		provider: number,
		typePost: number,
	): Promise<void> {
		const {
			characterLimit,
			characterKey,
			fields: requiredFields,
		} = providerPostType;

		await this.validateCharacterLimits(
			characterLimit,
			characterKey,
			content,
			provider,
			typePost,
		);
		await this.validateRequiredFields(content, requiredFields, typePost);
	}

	/**
	 * Valida los límites de caracteres del contenido.
	 * @param characterLimit - Límite de caracteres permitido.
	 * @param characterKey - Clave para acceder al contenido.
	 * @param content - Contenido a validar.
	 * @param provider - ID del proveedor.
	 * @param typePost - ID del tipo de publicación.
	 */
	private validateCharacterLimits(
		characterLimit: number,
		characterKey: string,
		content: any,
		provider: number,
		typePost: number,
	): void {
		if (!characterLimit || !characterKey) {
			throw new Error(
				`Límite de caracteres o clave de caracteres no establecido para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		const contentValue = characterKey
			.split('.')
			.reduce((obj, key) => obj && obj[key], content);

		if (typeof contentValue !== 'string') {
			throw new Error(
				`El contenido especificado por "${characterKey}" debe ser una cadena de texto.`,
			);
		}

		if (contentValue.length > characterLimit) {
			throw new Error(
				`El contenido excede el límite de caracteres para el proveedor "${provider}". Máximo permitido: ${characterLimit}, longitud actual: ${contentValue.length}.`,
			);
		}
	}

	/**
	 * Valida los campos requeridos del contenido.
	 * @param content - Contenido a validar.
	 * @param requiredFields - Campos requeridos y sus tipos.
	 * @param typePost - ID del tipo de publicación.
	 */
	private validateRequiredFields(
		content: any,
		requiredFields: Record<string, string>,
		typePost: number,
	): void {
		for (const [field, fieldType] of Object.entries(requiredFields)) {
			if (!(field in content)) {
				throw new Error(
					`El campo "${field}" es requerido para el tipo de publicación "${typePost}".`,
				);
			}

			if (typeof content[field] !== fieldType) {
				throw new Error(
					`El campo "${field}" debe ser de tipo "${fieldType}", pero se recibió "${typeof content[field]}".`,
				);
			}
		}
	}

	/**
	 * Crea el registro de la publicación en la base de datos.
	 * @param postType - Tipo de publicación.
	 * @param providerPostType - Tipo de publicación del proveedor.
	 * @param profileId - ID del perfil.
	 * @param content - Contenido de la publicación.
	 * @param unix - Timestamp para programación.
	 * @returns La nueva publicación creada.
	 */
	private async createPostRecord(
		postType: any,
		providerPostType: any,
		profileId: number,
		content: any,
		unix: number,
	): Promise<Post> {
		const postStatus = unix ? PostStatus.QUEUED : PostStatus.PUBLISHED;
		const taskStatus = unix ? TaskStatus.PENDING : TaskStatus.COMPLETED;
		const unixCurrentTimestamp = Math.floor(new Date().getTime() / 1000);

		return await this.prisma.post.create({
			data: {
				status: postStatus,
				postTypeId: postType.id,
				providerPostTypeId: providerPostType.id,
				profileId,
				fields: content,
				globalStatus: GlobalStatus.ACTIVE,
				task: {
					create: {
						status: taskStatus,
						unix: unix || unixCurrentTimestamp,
					},
				},
			},
			include: {
				ProviderPostType: {
					include: {
						provider: { select: { name: true } },
						posttype: { select: { name: true } },
					},
				},
				task: { select: { status: true, unix: true } },
			},
		});
	}
	/**
	 * Obtiene todas las publicaciones asociadas a un perfil específico.
	 * @param profileId - ID del perfil del cual se quieren obtener las publicaciones.
	 * @returns Perfil con sus publicaciones y relaciones asociadas.
	 * @throws {NotFoundException} Si el perfil no existe.
	 */
	async getPostsByProfile(profileId: number): Promise<Profile> {
		const profileWithPosts = await this.prisma.profile.findUnique({
			where: { id: profileId },
			include: this.getPostsIncludeQuery(),
		});

		if (!profileWithPosts) {
			throw new NotFoundException(
				`No se encontró el perfil con ID: ${profileId}`,
			);
		}

		return profileWithPosts;
	}

	/**
	 * Define la estructura de inclusión para la consulta de publicaciones.
	 * @returns Objeto de configuración para incluir relaciones en la consulta.
	 * @private
	 */
	private getPostsIncludeQuery(): PostsIncludeQuery {
		return {
			posts: {
				include: {
					task: {
						select: this.getTaskFields(),
					},
					ProviderPostType: {
						include: this.getProviderPostTypeFields(),
					},
				},
			},
		};
	}

	/**
	 * Define los campos a seleccionar para la tarea.
	 * @returns Objeto de selección de campos de tarea.
	 * @private
	 */
	private getTaskFields(): TaskFieldsSelect {
		return {
			status: true,
			unix: true,
		};
	}

	/**
	 * Define los campos a incluir para el tipo de publicación del proveedor.
	 * @returns Objeto de inclusión para los campos del proveedor y tipo de publicación.
	 * @private
	 */
	private getProviderPostTypeFields(): ProviderPostTypeFields {
		return {
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
		};
	}

	/**
	 * Publica un post en la red social correspondiente.
	 * @param profileId - ID del perfil que realiza la publicación.
	 * @param postId - ID del post a publicar.
	 * @throws {Error} Si el post no existe o si falla la publicación.
	 */
	async publishPost(profileId: number, postId: number): Promise<void> {
		try {
			const post = await this.getPostWithRelations(postId);
			const publishData = await this.extractPublishData(post);
			await this.executePublish(publishData);
			await this.update(profileId, postId);
		} catch (error) {
			await this.handlePublishError(postId, error);
		}
	}

	/**
	 * Obtiene el post y sus relaciones necesarias para la publicación.
	 * @param postId - ID del post a buscar.
	 * @returns Post con sus relaciones.
	 * @private
	 */
	private async getPostWithRelations(
		postId: number,
	): Promise<PostWithRelations> {
		const post = await this.prisma.post.findUnique({
			where: { id: postId },
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
			throw new NotFoundException('Post no encontrado');
		}

		return post as PostWithRelations;
	}

	/**
	 * Extrae y prepara los datos necesarios para la publicación.
	 * @param post - Post con sus relaciones.
	 * @returns Datos procesados para la publicación.
	 * @private
	 */
	private extractPublishData(post: PostWithRelations): PublishData {
		const provider = post.ProviderPostType.provider;
		const social = post.profile.socials.find(
			(s: any) => s.providerId === provider.id,
		);

		if (!social) {
			throw new Error('Credenciales sociales no encontradas');
		}

		return {
			typePostName: post.ProviderPostType.posttype.name,
			provider,
			accountId: social.accountId,
			token: social.access_token,
			fields: post.fields,
		};
	}

	/**
	 * Ejecuta la publicación utilizando el factory correspondiente.
	 * @param publishData - Datos necesarios para la publicación.
	 * @private
	 */
	private async executePublish(publishData: PublishData): Promise<void> {
		const factory = PostFactorySelector.getFactory(
			publishData.provider.name,
		);
		const publisher = factory.createPublisher();

		await publisher.publish(publishData.typePostName, publishData.fields, {
			accountId: publishData.accountId,
			token: publishData.token,
		});
	}

	/**
	 * Maneja los errores durante el proceso de publicación.
	 * @param {number} postId - ID del post que falló.
	 * @param {Error} error - Error capturado.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async handlePublishError(
		postId: number,
		error: Error | unknown,
	): Promise<void> {
		await Promise.all([
			this.prisma.post.update({
				where: { id: postId },
				data: { status: PostStatus.FAILED },
			}),
			this.prisma.task.updateMany({
				where: { postId },
				data: { status: TaskStatus.FAILED },
			}),
		]);

		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		const errorStack = error instanceof Error ? error.stack : undefined;

		this.logger.error('Error al publicar post:', {
			postId,
			error: errorMessage,
			stack: errorStack,
		});
	}

	/**
	 * Actualiza el estado de un post y su tarea asociada después de una publicación exitosa.
	 * @param profileId - ID del perfil propietario del post.
	 * @param postId - ID del post a actualizar.
	 * @throws {NotFoundException} Si el post no existe o no pertenece al perfil especificado.
	 */
	async update(profileId: number, postId: number): Promise<void> {
		const post = await this.findPostWithTask(profileId, postId);
		await this.updatePostStatus(postId);
		await this.updateTaskIfExists(post.task);

		this.logUpdateSuccess(postId);
	}

	/**
	 * Busca un post y su tarea asociada verificando la propiedad.
	 * @param {number} profileId - ID del perfil propietario.
	 * @param {number} postId - ID del post a buscar.
	 * @returns {Promise<PostWithTask>} Post encontrado con su tarea.
	 * @throws {NotFoundException} Si no se encuentra el post.
	 * @private
	 */
	private async findPostWithTask(
		profileId: number,
		postId: number,
	): Promise<PostWithTask> {
		const post = await this.prisma.post.findFirst({
			where: {
				id: postId,
				profileId,
			},
			include: { task: true },
		});

		if (!post) {
			throw new NotFoundException(
				`No se encontró el post con ID ${postId} para el perfil ${profileId}.`,
			);
		}

		return post;
	}

	/**
	 * Actualiza el estado del post a publicado.
	 * @param postId - ID del post a actualizar.
	 * @private
	 */
	private async updatePostStatus(postId: number): Promise<void> {
		await this.prisma.post.update({
			where: { id: postId },
			data: {
				globalStatus: GlobalStatus.ACTIVE,
				status: PostStatus.PUBLISHED,
			},
		});
	}

	/**
	 * Actualiza el estado de la tarea si existe.
	 * @param task - Tarea asociada al post.
	 * @private
	 */
	private async updateTaskIfExists(
		task: { id: number } | null,
	): Promise<void> {
		if (task) {
			await this.prisma.task.update({
				where: { id: task.id },
				data: { status: TaskStatus.COMPLETED },
			});
		}
	}

	/**
	 * Registra el éxito de la actualización.
	 * @param postId - ID del post actualizado.
	 * @private
	 */
	private logUpdateSuccess(postId: number): void {
		this.logger.log(`Post ${postId} ha sido publicado exitosamente.`);
	}

	/**
	 * Exporta las publicaciones según los criterios especificados.
	 * @param profileId - ID del perfil del cual exportar las publicaciones.
	 * @param exportPostsDto - DTO con los criterios de exportación.
	 * @returns Buffer del archivo exportado y su tipo de contenido.
	 * @throws {NotFoundException} Si no se encuentra el formato o no hay publicaciones.
	 */
	async exportPosts(
		profileId: number,
		exportPostsDto: ExportPostsDto,
	): Promise<{ fileBuffer: Buffer; header: { 'Content-Type': string } }> {
		const { startDate, endDate, providerIds, formatId } = exportPostsDto;
		const dateRange = this.createDateRange(startDate, endDate);
		const format = await this.getAndValidateFormat(formatId);

		const posts = await this.fetchPosts(profileId, dateRange, providerIds);
		const transformedPosts = this.transformPosts(posts);

		await this.createExportRecord(
			dateRange,
			JSON.parse(JSON.stringify(transformedPosts)) as Prisma.JsonValue,
			format.format,
		);

		return this.generateExport(
			format.format,
			posts as PostWithRelationsForExport[],
		);
	}

	/**
	 * Crea un rango de fechas para la consulta.
	 * @param startDate - Fecha de inicio.
	 * @param endDate - Fecha de fin.
	 * @private
	 */
	private createDateRange(startDate: string, endDate: string): DateRange {
		const start = new Date(startDate);
		start.setUTCHours(0, 0, 0, 0);

		const end = new Date(endDate);
		end.setUTCHours(23, 59, 59, 999);

		return { start, end };
	}

	/**
	 * Obtiene y valida el formato de exportación.
	 * @param formatId - ID del formato a buscar.
	 * @private
	 */
	private async getAndValidateFormat(
		formatId: number,
	): Promise<ExportFormatType> {
		const format = await this.prisma.exportFormat.findUnique({
			where: { id: formatId },
		});

		if (!format) {
			throw new NotFoundException('Formato de exportación no encontrado');
		}

		return format;
	}

	/**
	 * Construye y ejecuta la consulta para obtener las publicaciones.
	 * @param {number} profileId - ID del perfil.
	 * @param {DateRange} dateRange - Rango de fechas.
	 * @param {number[]} [providerIds] - IDs de los proveedores.
	 * @returns {Promise<PostWithIncludes[]>} Lista de publicaciones con sus relaciones.
	 * @throws {NotFoundException} Si no se encuentran publicaciones.
	 * @private
	 */
	private async fetchPosts(
		profileId: number,
		dateRange: DateRange,
		providerIds?: number[],
	): Promise<PostWithIncludes[]> {
		const posts = await this.prisma.post.findMany({
			where: this.buildPostsWhereClause(
				profileId,
				dateRange,
				providerIds,
			),
			include: this.getPostsIncludeClause(),
		});

		if (!posts.length) {
			throw new NotFoundException(
				'No se encontraron publicaciones en el rango de fechas especificado.',
			);
		}

		return posts;
	}

	/**
	 * Construye la cláusula where para la consulta de posts.
	 * @param {number} profileId - ID del perfil.
	 * @param {DateRange} dateRange - Rango de fechas.
	 * @param {number[]} [providerIds] - IDs de los proveedores.
	 * @returns {PostsWhereClause} Cláusula where para la consulta.
	 * @private
	 */
	private buildPostsWhereClause(
		profileId: number,
		dateRange: DateRange,
		providerIds?: number[],
	): PostsWhereClause {
		return {
			profileId,
			createdAt: {
				gte: dateRange.start,
				lte: dateRange.end,
			},
			...(providerIds !== undefined && providerIds.length > 0
				? { ProviderPostType: { providerId: { in: providerIds } } }
				: providerIds?.length === 0
					? { ProviderPostType: { providerId: { in: [] } } }
					: {}),
		};
	}

	/**
	 * Define la estructura de inclusión para la consulta de posts.
	 * @returns {PostsIncludeClause} Cláusula de inclusión para la consulta.
	 * @private
	 */
	private getPostsIncludeClause(): PostsIncludeClause {
		return {
			ProviderPostType: {
				include: {
					provider: true,
					posttype: true,
				},
			},
			profile: true,
			task: true,
			PostType: true,
		};
	}

	/**
	 * Transforma los posts al formato requerido para la exportación.
	 * @param posts - Posts a transformar.
	 * @private
	 */
	private transformPosts(posts: any[]): TransformedPost[] {
		return posts.map((post) => ({
			id: post.id,
			content: post.fields,
			postTypeId: post.postTypeId,
			provider: post.ProviderPostType?.provider.name,
			postType: post.ProviderPostType?.posttype.name,
			profileName: post.profile?.name,
			taskStatus: post.task?.status,
			taskUnix: post.task?.unix,
		}));
	}

	/**
	 * Crea un registro de la exportación en la base de datos.
	 * @param {DateRange} dateRange - Rango de fechas de la exportación.
	 * @param {Prisma.JsonValue} transformedPosts - Posts transformados en formato JSON.
	 * @param {string} format - Formato de exportación.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async createExportRecord(
		dateRange: DateRange,
		transformedPosts: Prisma.JsonValue,
		format: string,
	): Promise<void> {
		await this.prisma.export.create({
			data: {
				startDate: dateRange.start,
				endDate: dateRange.end,
				posts: transformedPosts,
				format: format,
			},
		});
	}

	/**
	 * Genera el archivo de exportación en el formato especificado.
	 * @param {string} format - Formato de exportación.
	 * @param {TransformedPost[]} posts - Posts a exportar.
	 * @returns {Buffer} Archivo exportado en formato Buffer.
	 * @private
	 */
	private generateExport(
		format: string,
		posts: PostWithRelationsForExport[],
	): Promise<ExportResult> {
		const exporter = ExportFactory.getExporter(format);
		return exporter.export(posts);
	}
}
