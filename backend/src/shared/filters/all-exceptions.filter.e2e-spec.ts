import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from '../../test/app-factory';
import { cleanDatabase } from '../../test/db-clean';

interface ErrorBody {
  statusCode: number;
  error: string;
  messages: string[];
  requestId?: string;
}

describe('AllExceptionsFilter (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('shape do envelope', () => {
    it('inclui statusCode, error, messages e requestId em camelCase', async () => {
      const res = await request(server)
        .get('/albums/00000000-0000-0000-0000-000000000000')
        .expect(404);
      const body = res.body as ErrorBody;

      expect(body.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
      expect(Array.isArray(body.messages)).toBe(true);
      expect(body.messages.length).toBeGreaterThan(0);
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId?.length ?? 0).toBeGreaterThan(0);
    });

    it('messages é sempre array (mesmo com 1 erro)', async () => {
      const res = await request(server).post('/albums').send({}).expect(400);
      const body = res.body as ErrorBody;

      expect(Array.isArray(body.messages)).toBe(true);
      expect(body.messages.length).toBeGreaterThan(0);
    });

    it('propaga X-Request-Id se enviado pelo cliente', async () => {
      const customId = 'meu-request-id-customizado';
      const res = await request(server)
        .get('/albums/00000000-0000-0000-0000-000000000000')
        .set('X-Request-Id', customId)
        .expect(404);
      const body = res.body as ErrorBody;

      expect(body.requestId).toBe(customId);
    });
  });

  describe('ZodValidationException', () => {
    it('mapeia issues do Zod em messages "path: mensagem"', async () => {
      const res = await request(server).post('/albums').send({}).expect(400);
      const body = res.body as ErrorBody;

      expect(body.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
      expect(body.messages.some((m) => m.startsWith('name:'))).toBe(true);
    });

    it('inclui múltiplos erros quando vários campos falham', async () => {
      const res = await request(server)
        .post('/albums')
        .send({ name: '   ', cover_ref: 'x'.repeat(3000) })
        .expect(400);
      const body = res.body as ErrorBody;

      expect(body.messages.length).toBeGreaterThanOrEqual(2);
      expect(body.messages.some((m) => m.startsWith('name:'))).toBe(true);
      expect(body.messages.some((m) => m.startsWith('cover_ref:'))).toBe(true);
    });

    it('rejeita campos desconhecidos (strict) com mensagem clara', async () => {
      const res = await request(server)
        .post('/albums')
        .send({ name: 'Álbum', campo_hackeado: 'valor' })
        .expect(400);
      const body = res.body as ErrorBody;

      expect(body.messages.some((m) => m.includes('campo_hackeado'))).toBe(
        true,
      );
    });
  });

  describe('HttpException padrão (NotFound, etc.)', () => {
    it('NotFoundException do service vira 404 com mensagem preservada', async () => {
      const res = await request(server)
        .get('/albums/00000000-0000-0000-0000-000000000000')
        .expect(404);
      const body = res.body as ErrorBody;

      expect(body.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
      expect(body.messages[0]).toContain('não encontrado');
    });

    it('ParseUUIDPipe (400 sem body malformado) usa nome "Bad Request"', async () => {
      const res = await request(server).get('/albums/nao-e-uuid').expect(400);
      const body = res.body as ErrorBody;

      expect(body.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });
  });
});
