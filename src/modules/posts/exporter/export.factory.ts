import { Exporter } from './export.interface';
import { ExcelExporter } from './excel.exporter';
import { PDFExporter } from './pdf.exporter';

export class ExportFactory {
	static getExporter(format: string): Exporter {
		switch (format) {
			case 'EXCEL':
				return new ExcelExporter();
			case 'PDF':
				return new PDFExporter();
			default:
				throw new Error('Formato no soportado');
		}
	}
}
