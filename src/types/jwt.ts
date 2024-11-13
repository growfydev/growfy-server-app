interface JwtPayload {
    id: number;
    email: string;
}

export type JWTPayloadInformation = JwtPayload;

export interface UserActiveInterface {
    id: number;
    email: string;
    role: string;
}
