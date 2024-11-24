import { Injectable } from "@nestjs/common";
import { ProfileMemberRoles } from "@prisma/client";
import { PrismaService } from "src/core/prisma.service";

@Injectable()
export class MemberService {
    constructor(private prisma: PrismaService) { }

    async createMember(userId: number, profileId: number, role: ProfileMemberRoles): Promise<any> {
        return this.prisma.member.create({ data: { userId, profileId, role } });
    }

    async getRolePermissions(role: ProfileMemberRoles): Promise<string[]> {
        const permissions = await this.prisma.ProfileMemberRolesPermission.findMany({
            where: { ProfileMemberRoles: role },
            select: { permission: { select: { name: true } } },
        });
        return permissions.map((p) => p.permission.name);
    }

    async getUserProfilesAndRoles(userId: number): Promise<
        { id: number; name: string; role: ProfileMemberRoles; permissions: string[] }[]
    > {
        const members = await this.prisma.member.findMany({
            where: { userId },
            include: {
                profile: true,
            },
        });

        const profilesAndRoles = await Promise.all(
            members.map(async (member) => {
                const permissions = await this.getRolePermissions(member.role);
                return {
                    id: member.profile.id,
                    name: member.profile.name,
                    role: member.role,
                    permissions,
                };
            })
        );

        return profilesAndRoles;
    }
}
