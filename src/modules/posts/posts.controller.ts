import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { ActiveUser } from '../auth/decorators/session.decorator';
import { UserType } from '../auth/types/auth';
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post(':profileId/create')
  @Auth([Role.USER], [ProfileMemberRoles.MANAGER])
  async create(
    @Body() createPostDto: CreatePostDto,
    @Param('profileId') profileId: number,
  ) {
    return this.postsService.createPost(createPostDto, +profileId);
  }
}
