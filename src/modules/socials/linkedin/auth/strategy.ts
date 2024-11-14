import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile as LinkedInProfile } from 'passport-linkedin-oauth2';
import { Request } from 'express';
import { LinkedInService } from '../linkedin.service';
import { configLoader } from 'src/lib/config.loader';
import { LinkedInAuthenticatedUser, LinkedInConfiguration } from 'src/types/socials/linkedin';
import { ParsedQs } from 'qs';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(private readonly linkedInService: LinkedInService) {
        const config: LinkedInConfiguration = configLoader();
        super({
            clientID: config.linkedin.api_key,
            clientSecret: config.linkedin.secret_key,
            callbackURL: config.linkedin.callback_uri,
            scope: ['r_liteprofile', 'r_emailaddress'],
            passReqToCallback: true,
        });
    }

    async validate(
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: LinkedInProfile
    ): Promise<LinkedInAuthenticatedUser> {
        const profileId = this.getProfileIdFromState(req.query.state);

        if (!profileId) {
            throw new Error('No profile ID provided in state');
        }

        await this.linkedInService.linkAccount(profileId, accessToken, refreshToken);
        return { accessToken, profile };
    }

    private getProfileIdFromState(state: string | string[] | ParsedQs | ParsedQs[]): number {
        let stateValue: string | undefined;

        if (Array.isArray(state)) {
            stateValue = typeof state[0] === 'string' ? state[0] : undefined;
        } else if (typeof state === 'string') {
            stateValue = state;
        }

        return stateValue ? parseInt(stateValue, 10) || 0 : 0;
    }

}
