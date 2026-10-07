import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  FusoHorarioBrasil,
  ListarFaturamentoQueryDto,
} from '@fluy/schema';
import { TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO } from '@/modules/faturamento/faturamento-data';
import {
  calcularFaturamento,
  converterPeriodoEmIntervalo,
  montarAtendimentoFaturamento,
  resolverPeriodo,
} from '@/modules/faturamento/faturamento-utils';
import { FaturamentoRepository } from '@/modules/faturamento/faturamento.repository';
import type {
  BuscarFaturamentoInput,
  FaturamentoResultado,
  IntervaloFaturamento,
  ListaAtendimentosFaturamentoResultado,
  ListarAtendimentosFaturamentoInput,
  PeriodoFaturamento,
} from '@/modules/faturamento/contracts';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { utcParaDataHoraCivil } from '@/shared/horario-salao/horario-salao.utils';
import {
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

@Injectable()
export class FaturamentoService {
  constructor(
    private readonly faturamentoRepository: FaturamentoRepository,
    private readonly salaoConsultaService: SalaoConsultaService,
  ) {}

  async buscar({
    salaoId,
    dados,
  }: BuscarFaturamentoInput): Promise<FaturamentoResultado> {
    const fusoHorario =
      await this.salaoConsultaService.obterFusoHorario(salaoId);
    const { periodo, intervalo } = this.resolverPeriodoDoSalao({
      dados,
      fusoHorario,
    });
    const encerramentos =
      await this.faturamentoRepository.listarEncerramentosDoPeriodo({
        salaoId,
        ...intervalo,
      });

    return {
      fusoHorario,
      periodo,
      ...calcularFaturamento({ encerramentos }),
    };
  }

  async listarAtendimentos({
    salaoId,
    dados: { cursor, ...dados },
  }: ListarAtendimentosFaturamentoInput): Promise<ListaAtendimentosFaturamentoResultado> {
    const offset = this.resolverOffset(cursor);
    const fusoHorario =
      await this.salaoConsultaService.obterFusoHorario(salaoId);
    const { intervalo } = this.resolverPeriodoDoSalao({ dados, fusoHorario });
    const linhas = await this.faturamentoRepository.listarAtendimentosDoPeriodo(
      {
        salaoId,
        ...intervalo,
        offset,
        limite: TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO + 1,
      },
    );
    const pagina = montarPagina({
      linhas,
      offset,
      tamanho: TAMANHO_PAGINA_ATENDIMENTOS_FATURAMENTO,
    });

    return {
      fusoHorario,
      itens: pagina.itens.map(montarAtendimentoFaturamento),
      proximoCursor: pagina.proximoCursor,
    };
  }

  private resolverPeriodoDoSalao({
    dados,
    fusoHorario,
  }: {
    dados: ListarFaturamentoQueryDto;
    fusoHorario: FusoHorarioBrasil;
  }): { periodo: PeriodoFaturamento; intervalo: IntervaloFaturamento } {
    const hoje = utcParaDataHoraCivil({
      dataHora: new Date(),
      fusoHorario,
    }).data;
    const periodo = resolverPeriodo({ dados, hoje });

    return {
      periodo,
      intervalo: converterPeriodoEmIntervalo({ periodo, fusoHorario }),
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
}
