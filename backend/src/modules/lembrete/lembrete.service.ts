import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteService } from '@/modules/cliente/cliente.service';
import type {
  AtualizarLembreteInput,
  BuscarLembreteInput,
  CriarLembreteInput,
  LembreteComClientePersistido,
  ListaLembretesResultado,
  ListarLembreteInput,
} from '@/modules/lembrete/contracts';
import { TAMANHO_PAGINA_LEMBRETES } from '@/modules/lembrete/lembrete-data';
import { calcularJanelaDoPeriodo } from '@/modules/lembrete/lembrete-utils';
import { LembreteRepository } from '@/modules/lembrete/lembrete.repository';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { utcParaDataHoraCivil } from '@/shared/horario-salao/horario-salao.utils';
import {
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

@Injectable()
export class LembreteService {
  constructor(
    private readonly lembreteRepository: LembreteRepository,
    private readonly clienteService: ClienteService,
    private readonly salaoConsultaService: SalaoConsultaService,
  ) {}

  async listar({
    cursor,
    periodo,
    ...filtros
  }: ListarLembreteInput): Promise<ListaLembretesResultado> {
    const offset = this.resolverOffset(cursor);
    const fusoHorario = await this.salaoConsultaService.obterFusoHorario(
      filtros.salaoId,
    );
    const hoje = utcParaDataHoraCivil({
      dataHora: new Date(),
      fusoHorario,
    }).data;
    const linhas = await this.lembreteRepository.listar({
      ...filtros,
      janela: calcularJanelaDoPeriodo({ periodo, hoje }),
      offset,
      limite: TAMANHO_PAGINA_LEMBRETES + 1,
    });

    return {
      fusoHorario,
      ...montarPagina({ linhas, offset, tamanho: TAMANHO_PAGINA_LEMBRETES }),
    };
  }

  async criar({
    dados,
    salaoId,
    usuarioSalaoId,
  }: CriarLembreteInput): Promise<LembreteComClientePersistido> {
    if (!usuarioSalaoId) {
      throw new BadRequestException(
        'Não foi possível identificar o autor do lembrete.',
      );
    }

    // Cliente inativa tem a ficha em leitura: não recebe lembrete novo.
    const clienteEncontrado = await this.clienteService.buscarPorId({
      id: dados.cliente_id,
      salaoId,
    });

    if (dados.agendamento_id) {
      const agendamentoDaCliente =
        await this.lembreteRepository.possuiAgendamentoDaCliente({
          agendamentoId: dados.agendamento_id,
          clienteId: dados.cliente_id,
          salaoId,
        });

      if (!agendamentoDaCliente) {
        throw new NotFoundException('Agendamento não encontrado.');
      }
    }

    const lembreteCriado = await this.lembreteRepository.criar({
      dados,
      autorId: usuarioSalaoId,
    });

    return {
      ...lembreteCriado,
      cliente: { id: clienteEncontrado.id, nome: clienteEncontrado.nome },
    };
  }

  async atualizar(
    input: AtualizarLembreteInput,
  ): Promise<LembreteComClientePersistido> {
    const lembreteAtivo = await this.buscarAtivo(input);
    const lembreteAtualizado = await this.lembreteRepository.atualizar(input);

    if (!lembreteAtualizado) {
      throw new ConflictException('Este lembrete já foi concluído.');
    }

    return { ...lembreteAtualizado, cliente: lembreteAtivo.cliente };
  }

  async concluir({
    id,
    salaoId,
  }: BuscarLembreteInput): Promise<LembreteComClientePersistido> {
    const lembreteAtivo = await this.buscarAtivo({ id, salaoId });
    const lembreteConcluido = await this.lembreteRepository.concluir({
      id,
      salaoId,
      concluidoEm: new Date(),
    });

    if (!lembreteConcluido) {
      throw new ConflictException('Este lembrete já foi concluído.');
    }

    return { ...lembreteConcluido, cliente: lembreteAtivo.cliente };
  }

  async remover({ id, salaoId }: BuscarLembreteInput): Promise<void> {
    await this.buscarPorId({ id, salaoId });
    await this.lembreteRepository.remover({ id, salaoId });
  }

  private async buscarAtivo(
    input: BuscarLembreteInput,
  ): Promise<LembreteComClientePersistido> {
    const lembreteEncontrado = await this.buscarPorId(input);

    if (lembreteEncontrado.status === 'concluido') {
      throw new ConflictException('Este lembrete já foi concluído.');
    }

    return lembreteEncontrado;
  }

  private async buscarPorId({
    id,
    salaoId,
  }: BuscarLembreteInput): Promise<LembreteComClientePersistido> {
    const lembreteEncontrado = await this.lembreteRepository.buscarPorId({
      id,
      salaoId,
    });

    if (!lembreteEncontrado) {
      throw new NotFoundException('Lembrete não encontrado.');
    }

    return lembreteEncontrado;
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
}
