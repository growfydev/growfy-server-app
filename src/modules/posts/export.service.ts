import * as ExcelJS from 'exceljs';
import * as PdfKit from 'pdfkit';

export class ExportService {
  async exportToExcel(posts: any[]): Promise<{ fileBuffer: any; header: any }> {
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

  async exportToPdf(posts: any[]): Promise<{ fileBuffer: any; header: any }> {
    const doc = new PdfKit();
    const buffers: Buffer[] = [];
    const header = { 'Content-Type': 'application/pdf' };

    // Recopilar el contenido en un buffer
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      console.log('PDF generado correctamente');
    });

    // Encabezado principal
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50') // Color del texto
      .text('Reporte de Publicaciones Exportadas', {
        align: 'center',
        underline: true,
      })
      .moveDown(1);

    // Subtítulo
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#7f8c8d')
      .text('Resumen de las publicaciones generadas', { align: 'center' })
      .moveDown(2);

    // Iterar sobre las publicaciones
    posts.forEach((post, index) => {
      // Separador entre publicaciones
      if (index > 0) {
        doc
          .moveDown()
          .strokeColor('#eaeaea') // Color de línea
          .lineWidth(0.5)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(1);
      }

      // Título del post
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#34495e')
        .text(`Publicación ID: ${post.id}`, { align: 'left' })
        .moveDown(0.5);

      // Información detallada
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#7f8c8d')
        .text(`Proveedor: ${post.ProviderPostType.provider.name}`, {
          indent: 20,
        })
        .text(`Tipo de Post: ${post.ProviderPostType.posttype.name}`, {
          indent: 20,
        })
        .text(
          `Fecha de Creación: ${new Date(post.createdAt).toLocaleDateString()}`,
          { indent: 20 },
        )
        .text(`Perfil Asociado: ${post.profile.name}`, { indent: 20 })
        .text(`Estado de la Tarea: ${post.task ? post.task.status : 'N/A'}`, {
          indent: 20,
        })
        .moveDown(1);

      // Formatear el contenido sin las llaves y comillas
      const fields = post.fields;
      let formattedContent = 'Contenido:\n'; // Agregar la palabra "Contenido:"

      // Recorrer los campos y agregarlos al contenido de manera más limpia
      for (const [key, value] of Object.entries(fields)) {
        formattedContent += `${key}: ${value}\n`; // Cada campo se presenta por separado
      }

      // Fondo de contenido con un color diferente
      doc
        .fillColor('#ecf0f1') // Fondo gris claro
        .rect(50, doc.y, 500, 60)
        .fill()
        .fillColor('#2c3e50') // Texto oscuro
        .fontSize(12)
        .text(formattedContent, 55, doc.y + 5, {
          width: 490,
          align: 'justify',
        })
        .moveDown(2);
    });

    // Pie de página con paginación
    const pageCount = doc.page.number;
    doc.on('pageAdded', () => {
      doc
        .fontSize(10)
        .fillColor('#bdc3c7')
        .text(`Página ${pageCount}`, 50, 750, { align: 'center' });
    });

    doc.end();

    // Retornar el buffer con el PDF generado
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));
    });

    return {
      fileBuffer,
      header,
    };
  }
}
