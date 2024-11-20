import { UserRoles } from "./roles";

export type JWTPayloadInformation = JwtPayload;

export interface UserActiveInterface {
    id: number;
    email: string;
    role: string;
}

export type JwtPayload = {
    userId: number;
    userRoles: UserRoles;
};
