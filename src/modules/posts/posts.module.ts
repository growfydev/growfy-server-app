import { forwardRef, Module } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AuthModule } from '../auth/auth.module';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import { TaskModule } from '../tasks/tasks.module';
import { ExportService } from './export.service';

@Module({
  imports: [forwardRef(() => TaskModule), forwardRef(() => AuthModule)],
  controllers: [PostsController],
  providers: [TaskQueueService, PostsService, PrismaService, ExportService],
  exports: [PostsService],
})
export class PostsModule {}
