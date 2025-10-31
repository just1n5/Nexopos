import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

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

  // CORS - Permitir múltiples orígenes
  const allowedOrigins = [
    'http://localhost:5173', // Desarrollo local
    'http://localhost:3000',
    'https://nexopos-1.onrender.com', // Frontend en Render
    'http://nexopos.cloution-servidor.local', // Backend en Dokku (para pruebas locales del frontend)
    'http://nexopos-frontend.cloution-servidor.local', // Frontend en Dokku
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
  console.log('CORS configured.');

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

  // SPA Fallback - Middleware para servir index.html en rutas del frontend
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    // Solo manejar GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Excluir rutas de API y uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }

    // Excluir archivos estáticos (tienen extensión)
    if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }

    // Servir index.html para rutas del frontend (SPA routing)
    const indexPath = join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
    res.sendFile(indexPath);
  });
  console.log('SPA fallback middleware configured.');

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