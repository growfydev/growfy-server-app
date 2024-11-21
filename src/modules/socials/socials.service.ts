import { Injectable } from '@nestjs/common';
import { FacebookService } from './facebook/facebook.service';
import { InstagramService } from './instagram/instagram.service';
import { CreatePostDto } from './common/dto/create-post.dto';
import { SchedulePostDto } from './common/dto/schedule-post.dto';
import { UpdatePostDto } from './common/dto/update-post.dto';

@Injectable()
export class SocialsService {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
  ) {}

  createPost(postData: CreatePostDto) {
    // Dependiendo de la red social, se usa el servicio correspondiente
    if (postData.platform === 'facebook') {
      return this.facebookService.createPost(postData);
    }
    if (postData.platform === 'instagram') {
      return this.instagramService.createPost(postData);
    }
    return 'Plataforma no soportada';
  }

  updatePost(postId: string, postData: UpdatePostDto) {
    // Dependiendo de la red social, se usa el servicio correspondiente
    if (postData.platform === 'facebook') {
      return this.facebookService.updatePost(postId, postData);
    }
    if (postData.platform === 'instagram') {
      return this.instagramService.updatePost(postId, postData);
    }
    return 'Plataforma no soportada';
  }

  schedulePost(postData: SchedulePostDto) {
    // Dependiendo de la red social, se usa el servicio correspondiente
    if (postData.platform === 'facebook') {
      return this.facebookService.schedulePost(postData, postData.scheduleTime);
    }
    if (postData.platform === 'instagram') {
      return this.instagramService.schedulePost(
        postData,
        postData.scheduleTime,
      );
    }
    return 'Plataforma no soportada';
  }
}
