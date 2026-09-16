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
    ClienteResponseDto,
    CriarClienteRequestDto,
    ListarClienteQueryDto,
} from '@/modules/cliente/contracts';
import { toClienteResponse } from '@/modules/cliente/cliente.mapper';
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
    @ApiOperation({ summary: 'Lista os clientes do salão atual' })
    @ApiOkResponse({
        description: 'Clientes ativos ordenados por nome.',
        type: [ClienteResponseDto.Output],
    })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    async listar(
        @TenantFromOwner() tenant: TenantContext,
        @Query() query: ListarClienteQueryDto,
    ) {
        const clientes = await this.clienteService.listar({
            salaoId: tenant.salaoId,
            status: query.status,
        });

        return clientes.map(toClienteResponse);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Busca um cliente do salão atual' })
    @ApiOkResponse({
        description: 'Cliente encontrado.',
        type: ClienteResponseDto.Output,
    })
    @ApiBadRequestResponse({ description: 'ID do cliente inválido.' })
    @ApiUnauthorizedResponse({
        description: 'Bearer token ausente ou inválido.',
    })
    @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
    async buscarPorId(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantFromOwner() tenant: TenantContext,
    ) {
        const cliente = await this.clienteService.buscarPorId({
            id,
            salaoId: tenant.salaoId,
        });

        return toClienteResponse(cliente);
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
