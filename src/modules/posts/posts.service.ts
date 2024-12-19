import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
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
	PostWithTaskAndProviderPostType,
	providerData,
	providerPostType,
	ProviderPostTypeFields,
	PublishData,
	Task,
	TaskFieldsSelect,
	TransformedPost,
} from './dtos/transformed-post.interface';
import { JsonValue } from '@prisma/client/runtime/library';

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
	): Promise<{ post: Post }> {
		const { typePost, provider, content, unix } = postData;

		const newPost = await this.processPostCreation(
			profileId,
			typePost,
			provider,
			content,
			unix,
		);

		return { post: newPost };
	}

	/**
	 * Reprograma un post existente para una nueva fecha de publicación
	 * @param profileId - ID del perfil propietario del post
	 * @param postId - ID del post a reprogramar
	 * @param newUnixTime - Nuevo timestamp para la publicación
	 * @throws {NotFoundException} Si el post no existe o no pertenece al perfil
	 * @throws {Error} Si el post no está en estado QUEUED
	 */
	async reschedulePost(
		profileId: number,
		postId: number,
		newUnixTime: number,
	): Promise<{ post: Post }> {
		const post = await this.findAndValidatePost(profileId, postId);
		await this.validatePostStatus(post);
		await this.updateScheduledTask(post, profileId, postId, newUnixTime);
		const updatedPost = {
			...post,
			task: { status: TaskStatus.PENDING, unix: newUnixTime },
		};

		this.logger.debug(
			`Post ${postId} reprogramado exitosamente para el timestamp ${newUnixTime}`,
		);

		return { post: updatedPost };
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
	 * Actualiza el estado de un post y su tarea asociada después de una publicación exitosa.
	 * @param profileId - ID del perfil propietario del post.
	 * @param postId - ID del post a actualizar.
	 * @throws {NotFoundException} Si el post no existe o no pertenece al perfil especificado.
	 */
	async update(profileId: number, postId: number): Promise<void> {
		const post = await this.findPostWithTask(profileId, postId);
		const postUpdated = await this.updatePostStatus(postId);
		if (!postUpdated) {
			throw new BadRequestException(
				`Error al actualizar el estado del post ${postId}.`,
			);
		}
		const taskUpdated = await this.updateTaskIfExists(post.task);
		if (!taskUpdated) {
			throw new BadRequestException(
				`Error al actualizar la tarea para el post ${postId}.`,
			);
		}
		this.logUpdateSuccess(postId);
	}

	/**
	 * Obtiene todas las publicaciones asociadas a un perfil específico.
	 * @param profileId - ID del perfil del cual se quieren obtener las publicaciones.
	 * @returns Perfil con sus publicaciones y relaciones asociadas.
	 * @throws {NotFoundException} Si el perfil no existe.
	 */
	async getPostsByProfile(profileId: number): Promise<{ profile: Profile }> {
		const profileWithPosts = await this.prisma.profile.findUnique({
			where: { id: profileId },
			include: this.getPostsIncludeQuery(),
		});

		if (!profileWithPosts) {
			throw new NotFoundException(
				`No se encontró el perfil con ID: ${profileId}`,
			);
		}

		return { profile: profileWithPosts };
	}

	/**
	 * Publica un post en la red social correspondiente.
	 * @param profileId - ID del perfil que realiza la publicación.
	 * @param postId - ID del post a publicar.
	 * @throws {Error} Si el post no existe o si falla la publicación.
	 */
	async publishPost(profileId: number, postId: number): Promise<void> {
		const post = await this.getPostWithRelations(postId);
		if (!post) {
			throw new NotFoundException(
				`No se encontró el post con ID: ${postId}`,
			);
		}
		const publishData = await this.extractPublishData(post);
		if (!publishData) {
			throw new BadRequestException(
				`No se pudo extraer los datos de publicación para el post con ID: ${postId}`,
			);
		}

		// Obtener las propiedades del post
		const properties = await this.getPostProperties(postId);
		console.log(properties);

		// Validamos las propiedades del
		await this.validatePostProperties(publishData, properties);

		const publishSuccess = await this.executePublish(publishData);
		if (!publishSuccess) {
			throw new BadRequestException(
				`Error al publicar el post con ID: ${postId}`,
			);
		}
		await this.update(profileId, postId);
	}

	// ---------------------------------
	// Private Methods
	// ---------------------------------
	/**
	 * Procesa la creación de un post, incluyendo validaciones y manejo de publicación.
	 * @param profileId - ID del perfil que crea la publicación.
	 * @param typePost - Tipo de publicación.
	 * @param provider - Proveedor de la publicación.
	 * @param content - Contenido de la publicación.
	 * @param unix - Timestamp para programación.
	 * @returns La nueva publicación creada.
	 * @throws {BadRequestException} Si alguna validación falla.
	 * @private
	 */
	private async processPostCreation(
		profileId: number,
		typePost: number,
		provider: number,
		content: Prisma.JsonValue,
		unix: number,
	): Promise<Post> {
		const profile = await this.validateProfile(profileId);
		if (!profile) {
			throw new BadRequestException(
				`No hay perfil asociado con el proveedor "${provider}".`,
			);
		}
		const postType = await this.getAndValidatePostType(typePost);
		if (!postType) {
			throw new BadRequestException(
				`Tipo de publicación "${typePost}" no encontrado.`,
			);
		}
		const providerData = await this.getAndValidateProvider(provider);
		if (!providerData) {
			throw new BadRequestException(
				`Proveedor "${provider}" no encontrado.`,
			);
		}
		const providerPostType = await this.validateProviderPostType(
			providerData.id,
			postType.id,
		);
		if (!providerPostType) {
			throw new BadRequestException(
				`Relación proveedor-tipo de publicación no encontrada para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		const contentLimitsValid = await this.validateContentLimits(
			content,
			providerPostType,
			provider,
			typePost,
		);
		if (!contentLimitsValid) {
			throw new BadRequestException(
				`El contenido no cumple con los límites de caracteres o campos requeridos para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}
		const contentFieldsValid = await this.validateContentFields(
			content,
			providerPostType,
			typePost,
		);
		if (!contentFieldsValid) {
			throw new BadRequestException(
				`El contenido no cumple con los campos requeridos para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		// Validar propiedades del post
		const newPost = await this.createPostRecord(
			postType,
			providerPostType,
			profileId,
			content,
			unix,
		);
		if (!newPost) {
			throw new BadRequestException(
				`Error al crear la publicación para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		const handlePostPublication = await this.handlePostPublication(
			profileId,
			newPost.id,
			unix,
		);
		if (!handlePostPublication) {
			throw new BadRequestException(
				`Error al manejar la publicación para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		return newPost;
	}

	/**
	 * Maneja la lógica de publicación del post según si está programado o no
	 * @param profileId - ID del perfil que realiza la publicación
	 * @param postId - ID del post a publicar
	 * @param unix - Timestamp para publicación programada
	 * @returns true si la publicación o programación fue exitosa
	 * @private
	 */
	private async handlePostPublication(
		profileId: number,
		postId: number,
		unix?: number,
	): Promise<boolean> {
		if (unix) {
			await this.taskQueueService.scheduleTask(profileId, postId, unix);
		} else {
			await this.publishPost(profileId, postId);
		}
		return true;
	}

	/**
	 * Valida que exista un perfil asociado al proveedor.
	 * @param profileId - ID del perfil a validar.
	 * @param provider - ID del proveedor.
	 * @returns true si el perfil existe, false en caso contrario.
	 */
	private async validateProfile(profileId: number): Promise<boolean> {
		const profile = await this.prisma.profile.findUnique({
			where: { id: profileId },
		});
		if (!profile) {
			return false;
		}
		return true;
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
	): Promise<providerPostType> {
		const providerPostType = await this.prisma.providerPostType.findFirst({
			where: {
				providerId,
				posttypeId: postTypeId,
			},
		});

		return providerPostType;
	}

	/**
	 * Valida los límites de caracteres del contenido.
	 * @param content - Contenido a validar.
	 * @param providerPostType - Tipo de publicación del proveedor.
	 * @param provider - ID del proveedor.
	 * @param typePost - ID del tipo de publicación.
	 * @returns true si los límites son válidos, false en caso contrario
	 */
	private async validateContentLimits(
		content: Prisma.JsonValue,
		providerPostType: providerPostType,
		provider: number,
		typePost: number,
	): Promise<boolean> {
		const limitsValid = await this.validateContentCharacterLimits(
			content,
			providerPostType,
			provider,
			typePost,
		);
		if (!limitsValid) {
			return false;
		}
		return true;
	}

	/**
	 * Valida los campos requeridos del contenido.
	 * @param content - Contenido a validar.
	 * @param providerPostType - Tipo de publicación del proveedor.
	 * @param typePost - ID del tipo de publicación.
	 * @returns true si los campos son válidos, false en caso contrario
	 */
	private async validateContentFields(
		content: Prisma.JsonValue,
		providerPostType: providerPostType,
		typePost: number,
	): Promise<boolean> {
		const fieldsValid = await this.validateContentRequiredFields(
			content,
			providerPostType,
			typePost,
		);
		if (!fieldsValid) {
			return false;
		}
		return true;
	}

	/**
	 * Valida los límites de caracteres del contenido según el tipo de publicación.
	 * @param content - Contenido a validar
	 * @param providerPostType - Configuración del tipo de publicación
	 * @param provider - ID del proveedor
	 * @param typePost - ID del tipo de publicación
	 * @returns true si los límites de caracteres son válidos, false en caso contrario
	 */
	private async validateContentCharacterLimits(
		content: Prisma.JsonValue,
		providerPostType: providerPostType,
		provider: number,
		typePost: number,
	): Promise<boolean> {
		const { characterLimit, characterKey } = providerPostType;
		this.validateCharacterLimits(
			characterLimit,
			characterKey,
			content,
			provider,
			typePost,
		);
		return true;
	}

	/**
	 * Valida que el contenido tenga todos los campos requeridos.
	 * @param content - Contenido a validar
	 * @param providerPostType - Configuración del tipo de publicación
	 * @param typePost - ID del tipo de publicación
	 * @returns true si todos los campos requeridos están presentes, false en caso contrario
	 */
	private async validateContentRequiredFields(
		content: Prisma.JsonValue,
		providerPostType: providerPostType,
		typePost: number,
	): Promise<boolean> {
		const { fields: requiredFields } = providerPostType;
		return await this.validateRequiredFields(
			content as Record<string, JsonValue>,
			requiredFields as Record<string, string>,
			typePost,
		);
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
		content: Prisma.JsonValue,
		provider: number,
		typePost: number,
	): void {
		if (!characterLimit || !characterKey) {
			throw new BadRequestException(
				`Límite de caracteres o clave de caracteres no establecido para el proveedor "${provider}" y tipo de publicación "${typePost}".`,
			);
		}

		const contentValue = characterKey
			.split('.')
			.reduce((obj, key) => obj && obj[key], content);

		if (typeof contentValue !== 'string') {
			throw new BadRequestException(
				`El contenido especificado por "${characterKey}" debe ser una cadena de texto.`,
			);
		}

		if (contentValue.length > characterLimit) {
			throw new BadRequestException(
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
		content: Record<string, JsonValue>,
		requiredFields: Record<string, string>,
		typePost: number,
	): boolean {
		for (const [field, fieldType] of Object.entries(requiredFields)) {
			if (!(field in content)) {
				throw new BadRequestException(
					`El campo "${field}" es requerido para el tipo de publicación "${typePost}".`,
				);
			}

			const actualType = Array.isArray(content[field])
				? 'array'
				: typeof content[field];

			// Verificar si es un arreglo de strings
			if (fieldType === 'string[]' && Array.isArray(content[field])) {
				if (!content[field].every((item) => typeof item === 'string')) {
					throw new BadRequestException(
						`Todos los elementos de "${field}" deben ser de tipo "string".`,
					);
				}
				continue;
			}

			if (actualType !== fieldType) {
				throw new BadRequestException(
					`El campo "${field}" debe ser de tipo "${fieldType}", pero se recibió "${actualType}".`,
				);
			}
		}
		return true;
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
		postType: postType,
		providerPostType: providerPostType,
		profileId: number,
		content: Prisma.JsonValue,
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
			id: true,
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
			(s) => s.providerId === provider.id,
		);

		if (!social) {
			throw new NotFoundException('Credenciales sociales no encontradas');
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
	 * @returns true si la publicación se ejecutó correctamente, false en caso contrario
	 * @private
	 */
	private async executePublish(publishData: PublishData): Promise<boolean> {
		const factory = PostFactorySelector.getFactory(
			publishData.provider.name,
		);
		const publisher = factory.createPublisher();

		await publisher.publish(publishData.typePostName, publishData.fields, {
			accountId: publishData.accountId,
			token: publishData.token,
		});
		return true;
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
	 * @returns true si el post se actualizó correctamente, false en caso contrario
	 * @private
	 */
	private async updatePostStatus(postId: number): Promise<boolean> {
		const postUpdated = await this.prisma.post.update({
			where: { id: postId },
			data: {
				globalStatus: GlobalStatus.ACTIVE,
				status: PostStatus.PUBLISHED,
			},
		});
		return postUpdated ? true : false;
	}

	/**
	 * Actualiza el estado de la tarea si existe.
	 * @param task - Tarea asociada al post.
	 * @returns true si la tarea se actualizó correctamente, false en caso contrario
	 * @private
	 */
	private async updateTaskIfExists(
		task: { id: number } | null,
	): Promise<boolean> {
		if (task) {
			await this.prisma.task.update({
				where: { id: task.id },
				data: { status: TaskStatus.COMPLETED },
			});
			return true;
		}
		return false;
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
	private transformPosts(posts: PostWithIncludes[]): TransformedPost[] {
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

	/**
	 * Busca y valida la existencia del post
	 * @private
	 */
	private async findAndValidatePost(
		profileId: number,
		postId: number,
	): Promise<PostWithTaskAndProviderPostType> {
		const post = await this.prisma.post.findFirst({
			where: {
				id: postId,
				profileId,
			},
			include: {
				task: {
					select: this.getTaskFields(),
				},
				ProviderPostType: {
					include: this.getProviderPostTypeFields(),
				},
			},
		});

		if (!post) {
			throw new NotFoundException(
				`No se encontró el post ${postId} para el perfil ${profileId}`,
			);
		}

		return post;
	}

	/**
	 * Valida que el post esté en estado QUEUED
	 * @private
	 */
	private async validatePostStatus(
		post: Post & { task: Task },
	): Promise<void> {
		if (post.status !== PostStatus.QUEUED) {
			throw new Error(
				'Solo se pueden reprogramar posts que estén en estado QUEUED',
			);
		}
	}

	/**
	 * Actualiza la tarea programada con el nuevo timestamp
	 * @private
	 */
	private async updateScheduledTask(
		post: Post & { task: Task },
		profileId: number,
		postId: number,
		newUnixTime: number,
	): Promise<void> {
		try {
			await Promise.all([
				// Reprogramar la tarea en la cola
				this.taskQueueService.rescheduleTask(
					profileId,
					postId,
					newUnixTime,
				),
				// Actualizar el unix time en la base de datos
				this.prisma.task.update({
					where: { id: post.task.id },
					data: { unix: newUnixTime },
				}),
			]);
		} catch (error) {
			this.logger.error(
				`Error al reprogramar el post ${postId}: ${error.message}`,
			);
			throw new Error('Error al reprogramar la publicación');
		}
	}

	/**
	 * Valida que el post tenga las propiedades necesarias
	 * @private
	 */
	private async validatePostProperties(
		publishData: PublishData,
		properties: JsonValue,
	): Promise<void> {
		const factory = PostFactorySelector.getFactory(
			publishData.provider.name,
		);
		const validator = factory.validationProperties();

		await validator.validation(
			publishData.typePostName,
			publishData.fields,
			properties,
		);
	}

	private async getPostProperties(postId: number): Promise<JsonValue> {
		const post = await this.prisma.post.findUnique({
			where: { id: postId },
			include: {
				ProviderPostType: {
					select: {
						properties: true, // Asegúrate de que esto esté correcto en tu modelo
					},
				},
			},
		});

		if (!post || !post.ProviderPostType) {
			throw new NotFoundException(
				`No se encontraron propiedades para el post con ID: ${postId}`,
			);
		}

		return post.ProviderPostType.properties;
	}
}
