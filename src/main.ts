import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './lib/AllExceptionsFilter';
import { ResponseInterceptor } from './lib/ResponseInterceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function main() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(configService.get('PORT'));

  const config = new DocumentBuilder()
    .setTitle('Mi API')
    .setDescription('Documentación de mi API')
    .setVersion('1.0')
    .addTag('endpoints')
    .addBearerAuth() // Si usas autenticación JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(app.get(ResponseInterceptor));
  await app.listen(port);
}
void main();
