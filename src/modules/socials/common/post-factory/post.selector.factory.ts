import { FacebookPostFactory } from '../../facebook/facebook-post.factory';
import { PostFactory } from './post.factory';

export class PostFactorySelector {
  static getFactory(provider: string): PostFactory {
    switch (provider) {
      case 'FACEBOOK':
        return new FacebookPostFactory();
      default:
        throw new Error(`No factory found for provider: ${provider}`);
    }
  }
}
