import type {
  FusoHorarioBrasil,
  ListarFaturamentoQueryDto,
  MotivoSinalRetido,
} from '@fluy/schema';
import {
  adicionarDiasNaData,
  dataHoraCivilParaUtc,
} from '@/shared/horario-salao/horario-salao.utils';
import type {
  AtendimentoFaturamento,
  CalculoFaturamento,
  EncerramentoPersistido,
  IntervaloFaturamento,
  PagamentoDoEncerramentoPersistido,
  PagamentoFaturamento,
  PeriodoFaturamento,
  SinalRetido,
} from '@/modules/faturamento/contracts';

export function resolverPeriodo({
  dados,
  hoje,
}: {
  dados: ListarFaturamentoQueryDto;
  hoje: string;
}): PeriodoFaturamento {
  if (!dados.periodo) {
    return {
      dataInicio: dados.data_inicio as string,
      dataFim: dados.data_fim as string,
    };
  }

  switch (dados.periodo) {
    case 'semana_atual':
      return resolverSemana({ data: hoje });
    case 'semana_anterior':
      return resolverSemana({
        data: adicionarDiasNaData({ data: hoje, dias: -7 }),
      });
    case 'mes_atual':
      return resolverMes({ data: hoje });
    case 'mes_anterior':
      return resolverMes({
        data: adicionarDiasNaData({ data: primeiroDiaDoMes(hoje), dias: -1 }),
      });
    case 'quinzena_atual':
      return resolverQuinzena({ data: hoje });
  }
}

// O período é civil no fuso do salão: é ele que decide em qual dia, semana ou
// mês cai um evento perto da meia-noite. O fim é exclusivo.
export function converterPeriodoEmIntervalo({
  periodo,
  fusoHorario,
}: {
  periodo: PeriodoFaturamento;
  fusoHorario: FusoHorarioBrasil;
}): IntervaloFaturamento {
  return {
    inicio: dataHoraCivilParaUtc({
      data: periodo.dataInicio,
      hora: '00:00',
      fusoHorario,
    }),
    fim: dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data: periodo.dataFim, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    }),
  };
}

export function calcularFaturamento({
  encerramentos,
}: {
  encerramentos: EncerramentoPersistido[];
}): CalculoFaturamento {
  const concluidos = encerramentos.filter(
    (encerramento) => encerramento.tipo === 'concluido',
  );
  const sinaisRetidos = encerramentos
    .filter((encerramento) => encerramento.tipo !== 'concluido')
    .map(montarSinalRetido)
    .filter((sinal) => sinal.valor_centavos > 0);

  const recebidoDosConcluidos = somarRecebido(
    concluidos.flatMap((encerramento) => encerramento.pagamentos),
  );
  const recebidoDosRetidos = sinaisRetidos.reduce(
    (total, sinal) => total + sinal.valor_centavos,
    0,
  );

  return {
    resumo: {
      total_faturado_centavos: recebidoDosConcluidos + recebidoDosRetidos,
      total_concluidos: concluidos.length,
      ticket_medio_centavos:
        concluidos.length > 0
          ? Math.round(recebidoDosConcluidos / concluidos.length)
          : null,
      total_pendentes: concluidos.filter(
        (encerramento) => calcularPendente(encerramento) > 0,
      ).length,
    },
    recebimentoPorMetodo: agruparPorMetodo(
      encerramentos.flatMap((encerramento) => encerramento.pagamentos),
    ),
    sinaisRetidos,
  };
}

export function montarAtendimentoFaturamento(
  encerramento: EncerramentoPersistido,
): AtendimentoFaturamento {
  return {
    agendamento_id: encerramento.agendamento_id,
    ocorreu_em: encerramento.ocorreu_em,
    cliente: encerramento.cliente,
    procedimento: encerramento.procedimento,
    valor_total_centavos: encerramento.preco_total_centavos,
    sinal: resumirPagamentos(
      encerramento.pagamentos.filter((pagamento) => pagamento.tipo === 'sinal'),
    ),
    restante: resumirPagamentos(
      encerramento.pagamentos.filter(
        (pagamento) => pagamento.tipo === 'restante',
      ),
    ),
    valor_pendente_centavos: calcularPendente(encerramento),
  };
}

function montarSinalRetido(encerramento: EncerramentoPersistido): SinalRetido {
  return {
    agendamento_id: encerramento.agendamento_id,
    ocorreu_em: encerramento.ocorreu_em,
    cliente: encerramento.cliente,
    procedimento: encerramento.procedimento,
    valor_centavos: somarRecebido(encerramento.pagamentos),
    motivo: resolverMotivo(encerramento),
  };
}

function resolverMotivo(
  encerramento: EncerramentoPersistido,
): MotivoSinalRetido {
  if (encerramento.tipo === 'falta') {
    return 'falta';
  }

  return encerramento.cancelado_por === 'cliente'
    ? 'cancelamento_cliente'
    : 'cancelamento_salao';
}

function calcularPendente(encerramento: EncerramentoPersistido): number {
  const pendente =
    encerramento.preco_total_centavos - somarRecebido(encerramento.pagamentos);

  return pendente > 0 ? pendente : 0;
}

function somarRecebido(
  pagamentos: PagamentoDoEncerramentoPersistido[],
): number {
  return pagamentos.reduce(
    (total, pagamento) => total + pagamento.valor_centavos,
    0,
  );
}

// No MVP há no máximo um pagamento por tipo; se houver mais, o valor soma e o
// método exibido é o do primeiro.
function resumirPagamentos(
  pagamentos: PagamentoDoEncerramentoPersistido[],
): PagamentoFaturamento | null {
  const recebidos = pagamentos.filter(
    (pagamento) => pagamento.valor_centavos > 0,
  );

  if (recebidos.length === 0) {
    return null;
  }

  return {
    origem: recebidos[0].origem,
    metodo: recebidos[0].metodo,
    valor_centavos: somarRecebido(recebidos),
  };
}

function agruparPorMetodo(
  pagamentos: PagamentoDoEncerramentoPersistido[],
): PagamentoFaturamento[] {
  const porMetodo = new Map<string, PagamentoFaturamento>();

  for (const pagamento of pagamentos) {
    if (pagamento.valor_centavos <= 0) {
      continue;
    }

    const chave = `${pagamento.origem}:${pagamento.metodo}`;
    const existente = porMetodo.get(chave);

    if (existente) {
      existente.valor_centavos += pagamento.valor_centavos;
      continue;
    }

    porMetodo.set(chave, {
      origem: pagamento.origem,
      metodo: pagamento.metodo,
      valor_centavos: pagamento.valor_centavos,
    });
  }

  return Array.from(porMetodo.values()).sort(
    (primeiro, segundo) => segundo.valor_centavos - primeiro.valor_centavos,
  );
}

function resolverSemana({ data }: { data: string }): PeriodoFaturamento {
  const [ano, mes, dia] = data.split('-').map(Number);
  const diaDaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  const diasDesdeSegunda = (diaDaSemana + 6) % 7;
  const dataInicio = adicionarDiasNaData({ data, dias: -diasDesdeSegunda });

  return {
    dataInicio,
    dataFim: adicionarDiasNaData({ data: dataInicio, dias: 6 }),
  };
}

function resolverMes({ data }: { data: string }): PeriodoFaturamento {
  return {
    dataInicio: primeiroDiaDoMes(data),
    dataFim: ultimoDiaDoMes(data),
  };
}

function resolverQuinzena({ data }: { data: string }): PeriodoFaturamento {
  const prefixoDoMes = data.slice(0, 8);

  return Number(data.slice(8, 10)) <= 15
    ? { dataInicio: `${prefixoDoMes}01`, dataFim: `${prefixoDoMes}15` }
    : { dataInicio: `${prefixoDoMes}16`, dataFim: ultimoDiaDoMes(data) };
}

function primeiroDiaDoMes(data: string): string {
  return `${data.slice(0, 8)}01`;
}

function ultimoDiaDoMes(data: string): string {
  const [ano, mes] = data.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  return `${data.slice(0, 8)}${ultimoDia.toString().padStart(2, '0')}`;
}
