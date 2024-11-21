export type Profile = {
    profileId: number;
    profileName: string;
    memberRole: string;
    permissions: string[];
};

export type UserRoles = {
    userRole: string;
    profiles: Profile[];
};
