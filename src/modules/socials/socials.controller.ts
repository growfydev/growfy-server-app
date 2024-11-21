import { Controller, Post, Body, Param, Put, Query } from '@nestjs/common';
import { SocialsService } from './socials.service';
import { CreatePostDto } from './common/dto/create-post.dto';
import { UpdatePostDto } from './common/dto/update-post.dto';
import { SchedulePostDto } from './common/dto/schedule-post.dto';

@Controller('socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) {}

  @Post('create')
  createPost(@Body() createPostDto: CreatePostDto) {
    return this.socialsService.createPost(createPostDto);
  }

  @Put('update/:id')
  updatePost(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.socialsService.updatePost(id, updatePostDto);
  }

  @Post('schedule')
  schedulePost(@Body() schedulePostDto: SchedulePostDto) {
    return this.socialsService.schedulePost(schedulePostDto);
  }
}
