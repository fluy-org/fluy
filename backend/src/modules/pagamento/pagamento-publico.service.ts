import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CriarAgendamentoPublicoDto,
  IniciarPagamentoPixDto,
} from '@fluy/schema';
import type { Env } from '@/config/env.schema';
import { AgendamentoPublicoService } from '@/modules/agendamento/agendamento-publico.service';
import { ClienteService } from '@/modules/cliente/cliente.service';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';
import { RecebimentoPixService } from '@/modules/salao-configuracao/recebimento-pix.service';

@Injectable()
export class PagamentoPublicoService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly cliente: ClienteService,
    private readonly agendamento: AgendamentoPublicoService,
    private readonly pagamento: PagamentoService,
    private readonly recebimentoPix: RecebimentoPixService,
  ) {}

  async reservar(input: {
    salaoId: string;
    dados: CriarAgendamentoPublicoDto;
  }) {
    this.exigirProvedor();
    await this.recebimentoPix.buscar(input.salaoId);
    return this.agendamento.reservar(input);
  }

  async iniciar(input: {
    salaoId: string;
    agendamentoId: string;
    dados: IniciarPagamentoPixDto;
  }) {
    this.exigirProvedor();
    const cliente = await this.resolverCliente({
      salaoId: input.salaoId,
      credencial: input.dados.credencial,
    });
    const escopo = {
      salaoId: input.salaoId,
      clienteId: cliente.id,
      agendamentoId: input.agendamentoId,
    };
    await this.pagamento.iniciar({
      ...escopo,
      modalidade: input.dados.modalidade,
    });
    return this.pagamento.consultar(escopo);
  }

  async consultar(input: {
    salaoId: string;
    agendamentoId: string;
    credencial: string;
  }) {
    this.exigirProvedor();
    const cliente = await this.resolverCliente(input);
    return this.pagamento.consultar({
      salaoId: input.salaoId,
      clienteId: cliente.id,
      agendamentoId: input.agendamentoId,
    });
  }

  private exigirProvedor() {
    if (this.config.get('PAYMENT_PROVIDER', { infer: true }) === 'disabled') {
      throw new ServiceUnavailableException('Pagamento online indisponível.');
    }
  }

  private async resolverCliente(input: {
    salaoId: string;
    credencial: string;
  }) {
    const cliente = await this.cliente.resolverSessaoPublica(input);
    if (!cliente)
      throw new NotFoundException('Sessão da cliente não encontrada.');
    return cliente;
  }
}
