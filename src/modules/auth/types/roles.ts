export type Profile = {
    profileId: number;
    profileName: string;
    memberRole: string;
    permissions: string[];
};

export type UserRoles = {
    userId: number;
    userRole: string;
    profiles: Profile[];
};
