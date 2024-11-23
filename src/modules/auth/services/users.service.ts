import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/core/prisma.service";
import { RegisterDto } from "../types/dto";
import { hashPassword } from "../utils/crypt";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async createUser(data: RegisterDto): Promise<User> {
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: await hashPassword(data.password),
            },
        });
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findUserById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async updateUser(email: string, data: Partial<User>): Promise<User> {
        return this.prisma.user.update({ where: { email }, data });
    }
}
