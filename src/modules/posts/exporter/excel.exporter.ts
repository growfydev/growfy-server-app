import * as ExcelJS from 'exceljs';
import { Exporter } from './export.interface';

export class ExcelExporter implements Exporter {
  async export(posts: any[]): Promise<{ fileBuffer: any; header: any }> {
    console.log('Posts a exportar:', posts); // Verifica los datos que llegan
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Publicaciones');
    const header = {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Proveedor', key: 'provider', width: 20 },
      { header: 'Tipo de Post', key: 'postType', width: 20 },
      { header: 'Fecha de Creación', key: 'createdAt', width: 20 },
      { header: 'Perfil', key: 'profile', width: 20 },
      { header: 'Tarea', key: 'task', width: 20 },
      { header: 'Contenido del Post', key: 'content', width: 50 },
    ];

    posts.forEach((post) => {
      sheet.addRow({
        id: post.id,
        provider: post.ProviderPostType.provider.name,
        postType: post.ProviderPostType.posttype.name,
        createdAt: post.createdAt.toISOString(),
        profile: post.profile.name,
        task: post.task ? post.task.status : 'N/A',
        content: JSON.stringify(post.fields), // Contenido del post serializado
      });
    });

    const fileBuffer = await workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        console.log('Excel generado correctamente.');
        return buffer;
      })
      .catch((err) => {
        console.error('Error al generar el Excel:', err);
        throw new Error('Error al generar el archivo Excel');
      });

    return { fileBuffer, header };
  }
}