import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from '@/app.module';
import type { Env } from '@/config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.set('trust proxy', 1);
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    allowedHeaders: ['Authorization', 'Content-Type', 'x-cliente-credencial'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fluy API')
    .setDescription('API da plataforma Fluy')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
