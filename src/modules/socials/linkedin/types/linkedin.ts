import { Profile as LinkedInProfile } from 'passport-linkedin-oauth2';

interface LinkedInConfig {
    linkedin: {
        api_key: string;
        secret_key: string;
        callback_uri: string;
    };
}

interface AuthenticatedUser {
    accessToken: string;
    profile: LinkedInProfile;
}

export type LinkedInConfiguration = LinkedInConfig;
export type LinkedInAuthenticatedUser = AuthenticatedUser;