// Backend mínimo funcional - Solo lo esencial para que funcione

import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Controlador simple de health
@Controller('health')
class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'NexoPOS Backend is running!'
    };
  }
}

// Módulo principal simplificado
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'nexopos',
      username: process.env.DB_USER || 'nexopos_user',
      password: process.env.DB_PASSWORD || 'nexopos123',
      entities: [],
      synchronize: true,
    }),
  ],
  controllers: [HealthController],
})
class AppModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('NexoPOS API')
    .setDescription('Sistema POS - Backend Mínimo Funcional')
    .setVersion('1.0.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = 3000;
  await app.listen(port);
  
  console.log(`
🚀 Backend funcionando en: http://localhost:${port}
📚 Documentación API: http://localhost:${port}/api
🔍 Health Check: http://localhost:${port}/api/health
  `);
}

bootstrap();
