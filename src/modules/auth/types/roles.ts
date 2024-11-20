export type UserRoles = {
    userRole: string;
    profiles: {
        profileId: number;
        profileName: string;
        memberRole: string;
    }[];
    permissions: string[];
};
