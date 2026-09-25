import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Put,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    AtualizarClienteRequestDto,
    ClienteFichaResponseDto,
    ClienteResponseDto,
    CriarClienteRequestDto,
    ListaAgendamentosClienteResponseDto,
    ListaClientesResponseDto,
    ListarAgendamentosClienteQueryDto,
    ListarClienteQueryDto,
} from '@/modules/cliente/contracts';
import {
    toAgendamentosDaClienteResponse,
    toClienteFichaResponse,
    toClienteResponse,
    toListaClientesResponse,
} from '@/modules/cliente/cliente.mapper';
import { ClienteService } from '@/modules/cliente/cliente.service';
import type { TenantContext } from '@/shared/tenant-context/contracts';
import { TenantFromOwner } from '@/shared/tenant-context/decorators/tenant-from-owner.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClienteController {
    constructor(private readonly clienteService: ClienteService) { }

    @Post()
    @ApiOperation({ summary: 'Cria um cliente no salão atual' })
    @ApiCreatedResponse({
        description: 'Cliente criado.',
        type: ClienteResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'Dados do cliente inválidos.' })
    @ApiConflictResponse({
        description: 'Já existe um cliente com este WhatsApp.',
    })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    async criar(
        @TenantFromOwner() tenant: TenantContext,
        @Body() dados: CriarClienteRequestDto,
    ) {
        const cliente = await this.clienteService.criar({
            dados,
            salaoId: tenant.salaoId,
        });

        return toClienteResponse(cliente);
    }

    @Get()
    @ApiOperation({ summary: 'Lista os clientes do salão atual, paginada por cursor' })
    @ApiOkResponse({
        description: 'Página de clientes filtrada e ordenada.',
        type: ListaClientesResponseDto.Output,
    })
    @ApiBadRequestResponse({
        description: 'Parâmetros de consulta ou cursor inválidos.',
    })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Salão não encontrado.' })
    async listar(
        @TenantFromOwner() tenant: TenantContext,
        @Query() query: ListarClienteQueryDto,
    ) {
        return toListaClientesResponse(
            await this.clienteService.listar({
                ...query,
                salaoId: tenant.salaoId,
            }),
        );
    }

    @Get(':id/agendamentos')
    @ApiOperation({
        summary: 'Lista o histórico de agendamentos de um cliente, paginado por cursor',
    })
    @ApiOkResponse({
        description: 'Página do histórico, do mais recente para o mais antigo.',
        type: ListaAgendamentosClienteResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'ID do cliente ou cursor inválido.' })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
    async listarAgendamentos(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
        @Query() query: ListarAgendamentosClienteQueryDto,
    ) {
        return toAgendamentosDaClienteResponse(
            await this.clienteService.listarAgendamentos({
                id,
                salaoId: tenant.salaoId,
                cursor: query.cursor,
            }),
        );
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Busca a ficha de um cliente do salão atual, com métricas',
    })
    @ApiOkResponse({
        description: 'Ficha do cliente, ativo ou inativo.',
        type: ClienteFichaResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'ID do cliente inválido.' })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
    async buscarFicha(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
    ) {
        return toClienteFichaResponse(
            await this.clienteService.buscarFicha({
                id,
                salaoId: tenant.salaoId,
            }),
        );
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualiza parcialmente um cliente do salão atual' })
    @ApiOkResponse({
        description: 'Cliente atualizado.',
        type: ClienteResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'ID ou dados do cliente inválidos.' })
    @ApiConflictResponse({
        description: 'Já existe um cliente com este WhatsApp.',
    })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
    async atualizar(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
        @Body() dados: AtualizarClienteRequestDto,
    ) {
        const cliente = await this.clienteService.atualizar({
            dados,
            id,
            salaoId: tenant.salaoId,
        });

        return toClienteResponse(cliente);
    }

    @Patch(':id/inativar')
    @ApiOperation({ summary: 'Inativa um cliente do salão atual' })
    @ApiOkResponse({
        description: 'Cliente inativado.',
        type: ClienteResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'ID do cliente inválido.' })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
    async inativar(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
    ) {
        const cliente = await this.clienteService.inativar({
            id,
            salaoId: tenant.salaoId,
        });

        return toClienteResponse(cliente);
    }

    @Patch(':id/reativar')
    @ApiOperation({ summary: 'Reativa um cliente do salão atual' })
    @ApiOkResponse({
        description: 'Cliente reativado.',
        type: ClienteResponseDto.Output,
    })
    @ApiNotFoundResponse({ description: 'Cliente inativo não encontrado.' })
    async reativar(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
    ) {
        const cliente = await this.clienteService.reativar({
            id,
            salaoId: tenant.salaoId,
        });

        return toClienteResponse(cliente);
    }
}
