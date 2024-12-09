import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Query,
	HttpException,
	HttpStatus,
	ParseIntPipe,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as ExcelJS from 'exceljs';
import { Express } from 'express';

interface CustomerUpload {
	name: string;
	globalStatus?: string;
}

@Controller('customers')
export class CustomerController {
	constructor(private readonly customerService: CustomerService) {}

	@Get()
	async listCustomers(
		@Query('profileId') profileId: number,
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Query('status') status?: 'ACTIVE' | 'INACTIVE' | 'DELETED',
	) {
		if (!profileId) {
			throw new HttpException(
				'Profile ID is required',
				HttpStatus.BAD_REQUEST,
			);
		}
		return this.customerService.listCustomers({
			profileId,
			page: +page,
			limit: +limit,
			status,
		});
	}

	@Delete(':id')
	async deleteCustomer(
		@Param('id', ParseIntPipe) customerId: number,
		@Query('profileId') profileId: number,
	) {
		if (!profileId) {
			throw new HttpException(
				'Profile ID is required',
				HttpStatus.BAD_REQUEST,
			);
		}
		return this.customerService.deleteCustomer(customerId, profileId);
	}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
	)
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Body('profileId') profileId: number,
	) {
		if (!file) {
			throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
		}
		if (!profileId) {
			throw new HttpException(
				'Profile ID is required',
				HttpStatus.BAD_REQUEST,
			);
		}
		if (!file.originalname.match(/\.(xls|xlsx)$/)) {
			throw new HttpException(
				'Only Excel files are allowed!',
				HttpStatus.BAD_REQUEST,
			);
		}
		const customers = await this.parseExcel(file.buffer);
		return this.customerService.saveCustomers(customers, profileId);
	}

	private async parseExcel(buffer: Buffer): Promise<CustomerUpload[]> {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);
		const worksheet = workbook.getWorksheet(1);
		const customers: CustomerUpload[] = [];

		worksheet.eachRow((row, rowNumber) => {
			if (rowNumber === 1) return;
			const [name, globalStatus] = row.values as string[];
			if (name) {
				customers.push({
					name: name.toString().trim(),
					globalStatus: globalStatus
						? globalStatus.toString().trim()
						: undefined,
				});
			}
		});

		return customers;
	}
}
