import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { GlobalStatus } from '@prisma/client';

@Injectable()
export class CustomerService {
	constructor(private readonly prisma: PrismaService) {}

	async listCustomers({
		profileId,
		page = 1,
		limit = 10,
	}: {
		profileId: number;
		page?: number;
		limit?: number;
		status?: GlobalStatus;
	}) {
		// Validate profile exists
		const profileExists = await this.prisma.profile.findUnique({
			where: { id: profileId },
		});

		if (!profileExists) {
			throw new HttpException(
				'Invalid Profile ID',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Calculate pagination
		const offset = (page - 1) * limit;

		// Fetch customers
		const customers = await this.prisma.customer.findMany({
			skip: offset,
			take: limit,
			orderBy: { createdAt: 'desc' },
		});

		// Count total customers
		const total = await this.prisma.customer.count({});

		return {
			customers,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async deleteCustomer(customerId: number, profileId: number) {
		// Validate customer exists and belongs to the profile
		const customer = await this.prisma.customer.findFirst({
			where: {
				id: customerId,
				profileId: profileId,
			},
		});

		if (!customer) {
			throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
		}

		// Soft delete (update status to DELETED)
		const deletedCustomer = await this.prisma.customer.update({
			where: { id: customerId },
			data: { globalStatus: 'DELETED' },
		});

		return {
			message: 'Customer successfully deleted',
			customer: deletedCustomer,
		};
	}

	async saveCustomers(
		customers: Array<{ name: string; globalStatus?: string }>,
		profileId: number,
	) {
		const createdCustomers = [];

		if (!profileId) {
			throw new HttpException(
				'Profile ID is required',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Verify the profile exists
		const profileExists = await this.prisma.profile.findUnique({
			where: { id: profileId },
		});

		if (!profileExists) {
			throw new HttpException(
				'Invalid Profile ID',
				HttpStatus.BAD_REQUEST,
			);
		}

		for (const customer of customers) {
			try {
				const created = await this.prisma.customer.create({
					data: {
						name: customer.name,
						profileId: profileId,
						globalStatus: customer.globalStatus
							? (customer.globalStatus as
									| 'ACTIVE'
									| 'INACTIVE'
									| 'DELETED')
							: 'ACTIVE',
					},
				});
				createdCustomers.push(created);
			} catch (error) {
				// Optional: Log the error or handle specific creation failures
				console.error(
					`Failed to create customer ${customer.name}:`,
					error,
				);
			}
		}

		return createdCustomers;
	}
}
