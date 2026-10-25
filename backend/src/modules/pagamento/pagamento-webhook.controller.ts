import {
  Controller,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { PagamentoWebhookService } from './pagamento-webhook.service';
@ApiTags('Notificações de pagamento')
@Controller('webhooks/pagamentos')
export class PagamentoWebhookController {
  constructor(private readonly service: PagamentoWebhookService) {}

  @Post()
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Recebe notificações autenticadas do provider' })
  @ApiOkResponse({
    description: 'Notificação persistida ou estado pendente recebido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Credencial da notificação inválida.',
  })
  @ApiBadRequestResponse({ description: 'Notificação inválida.' })
  @ApiServiceUnavailableResponse({ description: 'Provider indisponível.' })
  async receber(@Req() request: RawBodyRequest<Request>) {
    await this.service.receber({
      body: request.body,
      rawBody: request.rawBody,
      headers: request.headers,
      query: request.query,
    });
    return { recebido: true };
  }
}
