import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class UploadService {
    constructor(private readonly prisma: PrismaService) { }

    async saveCustomers(customers: Array<{ name: string; globalStatus: string }>) {
        const createdCustomers = [];

        for (const customer of customers) {
            const created = await this.prisma.customer.create({
                data: {
                    name: customer.name,
                    // globalStatus: customer.globalStatus,
                },
            });
            createdCustomers.push(created);
        }

        return createdCustomers;
    }
}
