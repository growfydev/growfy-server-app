interface JwtPayload {
  user: {
    id: number;
    role: string;
    profiles: Profile[];
  };
  iat: number;
  exp: number;
}

// interface UserActiveInterface {
//   id: number;
//   role: string;
// }

interface Profile {
  id: number;
  roles: string;
  permissions: string[];
}

interface RequestData {
  user: JwtPayload['user'] | undefined;
  params: Record<string, any>;
  body: Record<string, any>;
}

// export type UserType = {
//   id: number;
//   role: string;
//   profiles: Profile[];
// };

// export type UserActiveType = UserActiveInterface;
export type JwtPayloadType = JwtPayload;
// export type ProfileType = Profile;
export type RequestDataType = RequestData;
