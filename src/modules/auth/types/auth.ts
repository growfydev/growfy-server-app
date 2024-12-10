import { Role } from '@prisma/client';

interface JwtPayload {
	user: {
		id: number;
		role: string;
		profiles: Profile[];
	};
	iat: number;
	exp: number;
}

/**
 interface UserActiveInterface {
	id: number;
	role: string;
}

 export type UserType = {
  id: number;
  role: string;
  profiles: Profile[];
};

 */

interface Profile {
	id: number;
	roles: string;
	permissions: string[];
}

interface RequestData {
	user: JwtPayload['user'] | undefined;
	params: Record<string, unknown>;
	body: Record<string, unknown>;
}

interface UserJWTCreatePayload {
	id: number;
	role: Role;
}

export type UserJWTCreatePayloadType = UserJWTCreatePayload;

// export type UserActiveType = UserActiveInterface;
export type JwtPayloadType = JwtPayload;
// export type ProfileType = Profile;
export type RequestDataType = RequestData;
