import { webhookPagamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class WebhookPagamentoResponseDto extends createZodDto(
  webhookPagamentoResponseSchema,
) {}
