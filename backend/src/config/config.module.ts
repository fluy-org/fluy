import { join } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from '@/config/env.schema';

// Em dev/prod, este arquivo roda a partir de backend/dist/config,
// então subir 3 níveis chega em backend/.env.
const envFilePath = join(__dirname, '..', '..', '..', '.env');

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath,
      validate: (raw) => envSchema.parse(raw),
    }),
  ],
})
export class ConfigModule {}
