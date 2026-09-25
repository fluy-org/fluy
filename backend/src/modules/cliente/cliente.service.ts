import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import {
    DIAS_JANELA_RECENTE_CLIENTE,
    TAMANHO_PAGINA_AGENDAMENTOS_CLIENTE,
    TAMANHO_PAGINA_CLIENTES,
} from '@/modules/cliente/cliente-data';
import {
    decodificarCursorPagina,
    montarPagina,
} from '@/modules/cliente/cliente-utils';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import type {
    AtualizarClienteInput,
    BuscarClienteInput,
    ClienteFichaResultado,
    ClientePersistido,
    CriarClienteInput,
    IdentificarClientePublicaInput,
    ListaAgendamentosClienteResultado,
    ListaClientesResultado,
    ListarAgendamentosClienteInput,
    ListarClienteInput,
    ResolverSessaoClienteInput,
} from '@/modules/cliente/contracts';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { adicionarDiasNoInstante } from '@/shared/horario-salao/horario-salao.utils';

@Injectable()
export class ClienteService {
    constructor(
        private readonly clienteRepository: ClienteRepository,
        private readonly salaoConsultaService: SalaoConsultaService,
    ) { }

    async listar({
        cursor,
        ...filtros
    }: ListarClienteInput): Promise<ListaClientesResultado> {
        const offset = this.resolverOffset(cursor);
        const agora = new Date();
        const [fusoHorario, linhas] = await Promise.all([
            this.salaoConsultaService.obterFusoHorario(filtros.salaoId),
            this.clienteRepository.listar({
                ...filtros,
                agora,
                janelaRecenteDesde: adicionarDiasNoInstante({
                    instante: agora,
                    dias: -DIAS_JANELA_RECENTE_CLIENTE,
                }),
                offset,
                limite: TAMANHO_PAGINA_CLIENTES + 1,
            }),
        ]);

        return {
            fusoHorario,
            ...montarPagina({ linhas, offset, tamanho: TAMANHO_PAGINA_CLIENTES }),
        };
    }

    async buscarFicha(input: BuscarClienteInput): Promise<ClienteFichaResultado> {
        const [fusoHorario, ficha] = await Promise.all([
            this.salaoConsultaService.obterFusoHorario(input.salaoId),
            this.clienteRepository.buscarFicha(input),
        ]);

        if (!ficha) {
            throw new NotFoundException('Cliente não encontrado.');
        }

        return { ...ficha, fusoHorario };
    }

    async listarAgendamentos({
        cursor,
        ...escopo
    }: ListarAgendamentosClienteInput): Promise<ListaAgendamentosClienteResultado> {
        const offset = this.resolverOffset(cursor);

        const clienteExiste = await this.clienteRepository.possuiCliente(escopo);

        if (!clienteExiste) {
            throw new NotFoundException('Cliente não encontrado.');
        }

        const [fusoHorario, linhas] = await Promise.all([
            this.salaoConsultaService.obterFusoHorario(escopo.salaoId),
            this.clienteRepository.listarAgendamentos({
                ...escopo,
                offset,
                limite: TAMANHO_PAGINA_AGENDAMENTOS_CLIENTE + 1,
            }),
        ]);

        return {
            fusoHorario,
            ...montarPagina({
                linhas,
                offset,
                tamanho: TAMANHO_PAGINA_AGENDAMENTOS_CLIENTE,
            }),
        };
    }

    private resolverOffset(cursor: string | undefined): number {
        if (cursor === undefined) {
            return 0;
        }

        const offset = decodificarCursorPagina({ cursor });

        if (offset === undefined) {
            throw new BadRequestException('Cursor de paginação inválido.');
        }

        return offset;
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
