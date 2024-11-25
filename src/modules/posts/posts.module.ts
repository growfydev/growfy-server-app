import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [],
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService], 
})
export class PostsModule {}
