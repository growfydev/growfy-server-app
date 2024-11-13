import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-linkedin-oauth2';
import { PrismaService } from 'src/core/prisma.service';
import { Profile } from 'passport-linkedin-oauth2';
import { AuthService } from 'src/modules/auth/auth.service';
import { Request } from 'express';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor() {
        super({
            clientID: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            callbackURL: process.env.LINKEDIN_CALLBACK_URI,
            scope: process.env.LINKEDIN_SCOPES
        });
    }

    async authenticate(req: Request, options?: object) {

    }
}
