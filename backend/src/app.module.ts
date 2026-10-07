import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@/config/config.module';
import type { Env } from '@/config/env.schema';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AvisoModule } from '@/modules/aviso/aviso.module';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ArquivoModule } from '@/modules/arquivo/arquivo.module';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { AgendamentoModule } from '@/modules/agendamento/agendamento.module';
import { DisponibilidadeModule } from '@/modules/disponibilidade/disponibilidade.module';
import { LembreteModule } from '@/modules/lembrete/lembrete.module';
import { NotaModule } from '@/modules/nota/nota.module';
import { ProcedimentoModule } from '@/modules/procedimento/procedimento.module';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';
import { SalaoModule } from '@/modules/salao/salao.module';
import { SalaoOnboardingModule } from '@/modules/salao-onboarding/salao-onboarding.module';
import { UsuarioModule } from '@/modules/usuario/usuario.module';
import { ClerkModule } from '@/shared/providers/clerk/clerk.module';
import { R2StorageModule } from '@/shared/providers/r2/r2-storage.module';
import { AllExceptionsFilter } from '@/shared/filters/all-exceptions.filter';
import { TenantContextModule } from '@/shared/tenant-context/tenant-context.module';
import { TenantContextGuard } from '@/shared/tenant-context/guards/tenant-context.guard';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          // `debug` faz o pino-http registrar todas as leituras. Alem de
          // poluir o console, a serializacao padrao inclui os headers da
          // requisicao (por exemplo, Authorization).
          level: 'info',
          serializers: {
            req: (request) => ({
              id: request.id,
              method: request.method,
              // Query strings podem carregar credenciais em integracoes.
              url: request.url?.split('?')[0],
            }),
            res: (response) => ({ statusCode: response.statusCode }),
          },
          // Defesa em profundidade caso algum log futuro inclua esses campos.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers.x-api-key',
              'req.body.password',
              'req.body.token',
              'req.body.accessToken',
              'req.body.refreshToken',
              'req.body.secret',
              'res.headers.set-cookie',
            ],
            remove: true,
          },
          customLogLevel: (request, response, error) => {
            if (error || response.statusCode >= 500) return 'error';
            if (response.statusCode >= 400) return 'warn';

            // Escritas bem-sucedidas são o trilho de auditoria; leituras
            // rotineiras não precisam ocupar o console.
            return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
              request.method ?? '',
            )
              ? 'info'
              : 'silent';
          },
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_LIMIT', { infer: true }),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ClerkModule,
    R2StorageModule,
    AuthModule,
    AvisoModule,
    ArquivoModule,
    ClienteModule,
    AgendamentoModule,
    DisponibilidadeModule,
    LembreteModule,
    NotaModule,
    TenantContextModule,
    UsuarioModule,
    SalaoOnboardingModule,
    SalaoConfiguracaoModule,
    SalaoModule,
    ProcedimentoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useExisting: TenantContextGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
