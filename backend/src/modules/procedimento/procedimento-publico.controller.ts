import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Env } from '@/config/env.schema';
import { Public } from '@/modules/auth/decorators/public.decorator';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromHost } from '@/shared/tenant-context/decorators/tenant-from-host.decorator';
import { ProcedimentoPublicoResponseDto } from '@/modules/procedimento/contracts';
import { toProcedimentoPublicoResponse } from '@/modules/procedimento/procedimento.mapper';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';

@ApiTags('Catálogo público')
@Controller('publico')
export class ProcedimentoPublicoController {
  constructor(
    private readonly procedimentoService: ProcedimentoService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('procedimentos')
  @ApiOperation({ summary: 'Lista o catálogo público do salão' })
  @ApiOkResponse({
    description:
      'Procedimentos ativos ordenados por criação, do mais antigo ao mais novo.',
    type: [ProcedimentoPublicoResponseDto.Output],
  })
  @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
  async listar(@TenantFromHost() tenant: TenantContext) {
    const procedimentos = await this.procedimentoService.listarAtivos(
      tenant.salaoId,
    );

    const apiPublicUrl = this.config.get('API_PUBLIC_URL', { infer: true });

    return procedimentos.map((procedimento) =>
      toProcedimentoPublicoResponse({ procedimento, apiPublicUrl }),
    );
  }

  @Get('saloes/:salaoId/procedimentos/:procedimentoId/imagem')
  @Public()
  @ApiOperation({ summary: 'Obtém a imagem pública de um procedimento' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({ description: 'Imagem do procedimento.' })
  @ApiNotFoundResponse({
    description: 'Imagem do procedimento não encontrada.',
  })
  async obterImagem(
    @Param('salaoId', new ParseUUIDPipe()) salaoId: string,
    @Param('procedimentoId', new ParseUUIDPipe()) procedimentoId: string,
  ): Promise<StreamableFile> {
    const { arquivo, objeto } =
      await this.procedimentoService.obterImagemPublica({
        id: procedimentoId,
        salaoId,
      });

    return new StreamableFile(objeto.body, {
      length: objeto.contentLength,
      type: objeto.contentType ?? arquivo.mime_type,
    });
  }
}
