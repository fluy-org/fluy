import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteService } from '@/modules/cliente/cliente.service';
import type {
  AtualizarNotaInput,
  BuscarNotaInput,
  CriarNotaInput,
  ListaNotasResultado,
  ListarNotaInput,
  NotaPersistida,
} from '@/modules/nota/contracts';
import { TAMANHO_PAGINA_NOTAS } from '@/modules/nota/nota-data';
import { NotaRepository } from '@/modules/nota/nota.repository';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import {
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

@Injectable()
export class NotaService {
  constructor(
    private readonly notaRepository: NotaRepository,
    private readonly clienteService: ClienteService,
    private readonly salaoConsultaService: SalaoConsultaService,
  ) {}

  async listar({
    cursor,
    ...escopo
  }: ListarNotaInput): Promise<ListaNotasResultado> {
    const offset = this.resolverOffset(cursor);
    const [fusoHorario, linhas] = await Promise.all([
      this.salaoConsultaService.obterFusoHorario(escopo.salaoId),
      this.notaRepository.listar({
        ...escopo,
        offset,
        limite: TAMANHO_PAGINA_NOTAS + 1,
      }),
    ]);

    return {
      fusoHorario,
      ...montarPagina({ linhas, offset, tamanho: TAMANHO_PAGINA_NOTAS }),
    };
  }

  async criar({
    dados,
    salaoId,
    usuarioSalaoId,
  }: CriarNotaInput): Promise<NotaPersistida> {
    if (!usuarioSalaoId) {
      throw new BadRequestException(
        'Não foi possível identificar o autor da nota.',
      );
    }

    // Cliente inativa tem a ficha em leitura: não recebe nota nova.
    await this.clienteService.buscarPorId({ id: dados.cliente_id, salaoId });

    if (dados.agendamento_id) {
      const agendamentoDaCliente =
        await this.notaRepository.possuiAgendamentoDaCliente({
          agendamentoId: dados.agendamento_id,
          clienteId: dados.cliente_id,
          salaoId,
        });

      if (!agendamentoDaCliente) {
        throw new NotFoundException('Agendamento não encontrado.');
      }
    }

    return this.notaRepository.criar({ dados, autorId: usuarioSalaoId });
  }

  async atualizar(input: AtualizarNotaInput): Promise<NotaPersistida> {
    const notaAtualizada = await this.notaRepository.atualizar(input);

    if (!notaAtualizada) {
      throw new NotFoundException('Nota não encontrada.');
    }

    return notaAtualizada;
  }

  async remover({ id, salaoId }: BuscarNotaInput): Promise<void> {
    const notaEncontrada = await this.notaRepository.buscarPorId({
      id,
      salaoId,
    });

    if (!notaEncontrada) {
      throw new NotFoundException('Nota não encontrada.');
    }

    await this.notaRepository.remover({ id, salaoId });
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
