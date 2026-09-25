import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import type { AtualizarClienteInput, BuscarClienteInput, ClientePersistido, CriarClienteInput, ListarClienteInput, IdentificarClientePublicaInput, ResolverSessaoClienteInput } from '@/modules/cliente/contracts';

@Injectable()
export class ClienteService {
    constructor(private readonly clienteRepository: ClienteRepository) { }

    listar(input: ListarClienteInput) {
        return this.clienteRepository.listar(input);
    }

    async buscarPorId(input: BuscarClienteInput): Promise<ClientePersistido> {
        const clienteEncontrado = await this.clienteRepository.buscarPorId(input);

        if (!clienteEncontrado) {
            throw new NotFoundException('Cliente não encontrado.');
        }

        return clienteEncontrado;
    }

    async criar(input: CriarClienteInput): Promise<ClientePersistido> {
        try {
            return await this.clienteRepository.criar(input);
        } catch (error) {
            this.rethrowWhatsappConflict(error);
        }
    }

    private rethrowWhatsappConflict(error: unknown): never {
        if (
            typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505' && (error as { constraint?: unknown }).constraint === 'cliente_salao_whatsapp_uq') {
            throw new ConflictException(
                'Já existe um cliente com este WhatsApp.',
            );
        }

        throw error;
    }

    async atualizar(input: AtualizarClienteInput): Promise<ClientePersistido> {
        let clienteAtualizado: ClientePersistido | undefined;

        try {
            clienteAtualizado = await this.clienteRepository.atualizar(input);
        } catch (error) {
            this.rethrowWhatsappConflict(error);
        }

        if (!clienteAtualizado) {
            throw new NotFoundException('Cliente não encontrado.');
        }

        return clienteAtualizado;
    }

    async inativar(input: BuscarClienteInput): Promise<ClientePersistido> {
        const clienteInativado = await this.clienteRepository.inativar(input);

        if (!clienteInativado) {
            throw new NotFoundException('Cliente não encontrado.');
        }

        return clienteInativado;
    }

    async reativar(input: BuscarClienteInput): Promise<ClientePersistido> {
        const clienteReativado = await this.clienteRepository.reativar(input);

        if (!clienteReativado) {
            throw new NotFoundException('Cliente inativo não encontrado.');
        }

        return clienteReativado;
    }

    resolverSessaoPublica(input: ResolverSessaoClienteInput) {
        return this.clienteRepository.resolverSessao(input);
    }

    async identificarPublicamente(
        input: IdentificarClientePublicaInput,
    ): Promise<ClientePersistido> {
        const resultado = await this.clienteRepository.identificarPublicamente(input);

        if (resultado.conflitoCredencial) {
            throw new ConflictException(
                'A identificação deste dispositivo precisa ser renovada.',
            );
        }

        if (!resultado.cliente) {
            throw new InternalServerErrorException(
                'Não foi possível identificar a cliente.',
            );
        }

        return resultado.cliente;
    }
}
