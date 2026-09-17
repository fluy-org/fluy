import { ACAO_AGENDAMENTO } from '@fluy/schema';
import { utcParaDataHoraCivil } from '@/shared/horario-salao/horario-salao.utils';
import type {
  AcoesDoAgendamento,
  CalcularAcoesAgendamentoInput,
  ContagemPorDia,
  InstanteDeAgendamentoPersistido,
  PagamentoDoAgendamentoPersistido,
} from '@/modules/agendamento/contracts';

const ACOES_DO_AGENDADO = ACAO_AGENDAMENTO.filter(
  (acao) => acao !== 'marcar_falta',
);

export function emCentavos({ valor }: { valor: string }): bigint {
  const [inteiro, decimal = ''] = valor.split('.');
  const centavos = decimal.padEnd(2, '0').slice(0, 2);

  return BigInt(inteiro) * 100n + BigInt(centavos);
}

export function formatarCentavos({ valor }: { valor: bigint }): string {
  const sinal = valor < 0n ? '-' : '';
  const absoluto = valor < 0n ? -valor : valor;
  const inteiro = absoluto / 100n;
  const centavos = (absoluto % 100n).toString().padStart(2, '0');

  return `${sinal}${inteiro}.${centavos}`;
}

export function calcularValorSinalDoProcedimento(procedimento: {
  preco: string;
  tipo_sinal: 'percentual' | 'fixo';
  valor_sinal: string;
}): string {
  if (procedimento.tipo_sinal === 'fixo') {
    return formatarCentavos({
      valor: emCentavos({ valor: procedimento.valor_sinal }),
    });
  }

  const precoEmCentavos = emCentavos({ valor: procedimento.preco });
  const percentualEmCentimos = emCentavos({ valor: procedimento.valor_sinal });
  const valorSinalEmCentavos =
    (precoEmCentavos * percentualEmCentimos + 5_000n) / 10_000n;

  return formatarCentavos({ valor: valorSinalEmCentavos });
}

export function calcularValorPago({
  pagamentos,
}: {
  pagamentos: PagamentoDoAgendamentoPersistido[];
}): string {
  const totalEmCentavos = pagamentos
    .filter(ehPagamentoConfirmado)
    .reduce(
      (total, pagamento) => total + emCentavos({ valor: pagamento.valor }),
      0n,
    );

  return formatarCentavos({ valor: totalEmCentavos });
}

export function calcularValorPendente({
  precoTotal,
  valorPago,
}: {
  precoTotal: string;
  valorPago: string;
}): string {
  const pendenteEmCentavos =
    emCentavos({ valor: precoTotal }) - emCentavos({ valor: valorPago });

  return formatarCentavos({
    valor: pendenteEmCentavos > 0n ? pendenteEmCentavos : 0n,
  });
}

export function calcularAcoesDoAgendamento({
  estado,
  inicioEm,
  toleranciaAtrasoMin,
  agora,
}: CalcularAcoesAgendamentoInput): AcoesDoAgendamento {
  if (estado !== 'agendado') {
    return { acoesPermitidas: [], avisos: [] };
  }

  if (agora.getTime() < inicioEm.getTime()) {
    return {
      acoesPermitidas: [...ACOES_DO_AGENDADO],
      avisos: ['conclusao_antecipada'],
    };
  }

  const toleranciaExpiraEm =
    inicioEm.getTime() + toleranciaAtrasoMin * 60 * 1_000;

  return {
    acoesPermitidas: [...ACOES_DO_AGENDADO, 'marcar_falta'],
    avisos:
      agora.getTime() < toleranciaExpiraEm ? ['falta_antes_da_tolerancia'] : [],
  };
}

export function contarAgendamentosPorDia({
  instantes,
  fusoHorario,
}: {
  instantes: InstanteDeAgendamentoPersistido[];
  fusoHorario: string;
}): ContagemPorDia[] {
  const totaisPorDia = new Map<string, number>();

  for (const instante of instantes) {
    const { data } = utcParaDataHoraCivil({
      dataHora: instante.inicio_em,
      fusoHorario,
    });

    totaisPorDia.set(data, (totaisPorDia.get(data) ?? 0) + 1);
  }

  return Array.from(totaisPorDia, ([data, total]) => ({ data, total })).sort(
    (primeiro, segundo) => primeiro.data.localeCompare(segundo.data),
  );
}

function ehPagamentoConfirmado(
  pagamento: PagamentoDoAgendamentoPersistido,
): boolean {
  return pagamento.status === null || pagamento.status === 'confirmada';
}
