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

  // CORS - Permitir múltiples orígenes
  const allowedOrigins = [
    'http://localhost:5173', // Desarrollo local
    'http://localhost:3000',
    'https://nexopos-1.onrender.com', // Frontend en Render
    'https://overbridgenet.com', // Dominio personalizado
    'https://www.overbridgenet.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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