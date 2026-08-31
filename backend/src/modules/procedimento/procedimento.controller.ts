import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';
import {
  AtualizarProcedimentoRequestDto,
  CriarProcedimentoRequestDto,
  ProcedimentoResponseDto,
} from '@/modules/procedimento/contracts';
import { toProcedimentoResponse } from '@/modules/procedimento/procedimento.mapper';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';

@ApiTags('Procedimentos')
@ApiBearerAuth()
@Controller('procedimentos')
export class ProcedimentoController {
  constructor(private readonly procedimentoService: ProcedimentoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um procedimento do salão atual' })
  @ApiCreatedResponse({
    description: 'Procedimento criado e ativo.',
    type: ProcedimentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Dados do procedimento inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  async criar(
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: CriarProcedimentoRequestDto,
  ) {
    return toProcedimentoResponse(
      await this.procedimentoService.criar({
        dados,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista procedimentos ativos e inativos do salão' })
  @ApiOkResponse({
    description:
      'Procedimentos ordenados por criação, do mais antigo ao mais novo.',
    type: [ProcedimentoResponseDto.Output],
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  async listar(@TenantFromOwner() tenant: TenantContext) {
    const procedimentos = await this.procedimentoService.listar(tenant.salaoId);

    return procedimentos.map(toProcedimentoResponse);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um procedimento do salão' })
  @ApiOkResponse({
    description: 'Procedimento atualizado.',
    type: ProcedimentoResponseDto.Output,
  })
  @ApiBadRequestResponse({ description: 'Dados do procedimento inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Procedimento não encontrado.' })
  async atualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
    @Body() dados: AtualizarProcedimentoRequestDto,
  ) {
    return toProcedimentoResponse(
      await this.procedimentoService.atualizar({
        dados,
        id,
        salaoId: tenant.salaoId,
      }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa um procedimento do salão' })
  @ApiOkResponse({
    description: 'Procedimento inativado.',
    type: ProcedimentoResponseDto.Output,
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token ausente ou inválido.',
  })
  @ApiNotFoundResponse({ description: 'Procedimento não encontrado.' })
  async desativar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @TenantFromOwner() tenant: TenantContext,
  ) {
    return toProcedimentoResponse(
      await this.procedimentoService.desativar({
        id,
        salaoId: tenant.salaoId,
      }),
    );
  }
}
