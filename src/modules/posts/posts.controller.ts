import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { ExportPostsDto } from './dtos/export-posts.dto'; // Importa el nuevo DTO
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';
import { Response } from 'express';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post(':profileId/create')
  @ResponseMessage('Posts creado exitosamente')
  @Auth([Role.USER], [ProfileMemberRoles.MANAGER])
  async create(
    @Body() createPostDto: CreatePostDto,
    @Param('profileId') profileId: number,
  ) {
    return this.postsService.createPost(createPostDto, +profileId);
  }

  @Get(':profileId/posts')
  @Auth([Role.USER], [ProfileMemberRoles.MANAGER])
  async getPostsByProfile(@Param('profileId') profileId: number) {
    const posts = await this.postsService.getPostsByProfile(+profileId);
    if (!posts) {
      throw new NotFoundException(
        `No se encontraron posts para el perfil con ID ${profileId}.`,
      );
    }
    return posts;
  }
  @Post(':profileId/export')
  @Auth([Role.USER], [ProfileMemberRoles.MANAGER])
  async exportPosts(
    @Body() exportPostsDto: ExportPostsDto,
    @Param('profileId') profileId: number,
    @Res() res: Response,
  ) {
    const { fileBuffer, header } = await this.postsService.exportPosts(
      +profileId,
      exportPostsDto,
    );

    res.set(header);
    res.status(HttpStatus.OK).send(fileBuffer);
  }
}
