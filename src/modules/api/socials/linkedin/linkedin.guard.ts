import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
    getAuthenticateOptions(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const profileId = request.query.profileId;
        return { state: profileId };
    }
}
