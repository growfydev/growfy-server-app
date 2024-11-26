import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as ExcelJS from 'exceljs';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) { }

    @Post('customers')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) // Limita el tamaño a 5 MB
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        if (!file.originalname.match(/\.(xls|xlsx)$/)) {
            throw new HttpException('Only Excel files are allowed!', HttpStatus.BAD_REQUEST);
        }

        const customers = await this.parseExcel(file.buffer);
        return this.smsService.saveCustomers(customers);
    }

    private async parseExcel(buffer: Buffer): Promise<Array<{ name: string; globalStatus: string }>> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.getWorksheet(1); // Usar la primera hoja
        const customers = [];

        worksheet.eachRow((row, rowNumber) => {
            // Salta la fila de encabezados
            if (rowNumber === 1) return;

            const [name, globalStatus] = row.values as string[]; // Ajusta según tus columnas
            if (name && globalStatus) {
                customers.push({
                    name: name.toString().trim(),
                    globalStatus: globalStatus.toString().trim(),
                });
            }
        });

        return customers;
    }
}
