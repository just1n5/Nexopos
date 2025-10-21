import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  console.log('Starting bootstrap process...');
  const app = await NestFactory.create(AppModule);
  console.log('Nest application created.');

  // Configuración Global
  app.setGlobalPrefix('api');
  console.log('Global prefix set to /api.');
  
  // Validación Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { 
        enableImplicitConversion: true 
      }
    })
  );
  console.log('Global validation pipe configured.');

  app.enableCors();
  console.log('CORS configured with permissive settings for debugging.');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('NexoPOS API')
    .setDescription('Sistema POS para tiendas en Colombia - API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log('Swagger documentation configured.');

  // Puerto
  const port = process.env.PORT || 3000;
  console.log(`Attempting to listen on port ${port}...`);
  await app.listen(port);
  console.log(`Successfully listening on port ${port}`);
  
  console.log(`
🚀 NexoPOS Backend running on http://localhost:${port}
📚 API Documentation: http://localhost:${port}/api
🔐 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();