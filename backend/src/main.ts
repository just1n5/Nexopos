import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración Global
  app.setGlobalPrefix('api');
  
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

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('NexoPOS API')
    .setDescription('Sistema POS para tiendas en Colombia - API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Puerto
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
🚀 NexoPOS Backend running on http://localhost:${port}
📚 API Documentation: http://localhost:${port}/api
🔐 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();