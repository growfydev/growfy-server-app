import { Exporter } from './export.interface';
import { ExcelExporter } from './excel.exporter';
import { PdfExporter } from './pdf.exporter';

export class ExportFactory {
  static getExporter(format: string): Exporter {
    switch (format) {
      case 'EXCEL':
        return new ExcelExporter();
      case 'PDF':
        return new PdfExporter();
      default:
        throw new Error('Formato no soportado');
    }
  }
}
