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

export interface RequestData {
    user: { userRoles: UserRoles } | undefined;
    params: Record<string, any>;
    body: Record<string, any>;
}