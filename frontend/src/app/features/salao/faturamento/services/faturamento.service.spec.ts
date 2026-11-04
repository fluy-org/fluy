import { HttpClient } from '@angular/common/http';
import {
  createEnvironmentInjector,
  runInInjectionContext,
  type EnvironmentInjector,
} from '@angular/core';
import { Subject } from 'rxjs';
import type {
  FaturamentoResponseDto,
  SinalRetidoResponseDto,
} from '@fluy/schema';
import { ApiError } from '@app/core/errors/api-error';
import { FaturamentoService } from '@app/features/salao/faturamento/services/faturamento.service';

describe('FaturamentoService: sinais retidos paginados', () => {
  let service: FaturamentoService;
  let injector: EnvironmentInjector;
  let pedidos: Array<{
    url: string;
    params: unknown;
    resposta: Subject<unknown>;
  }>;
  const periodo = { data_inicio: '2026-09-01', data_fim: '2026-09-30' };
  const resumo: FaturamentoResponseDto = {
    fuso_horario: 'America/Sao_Paulo',
    periodo,
    resumo: {
      total_faturado: 250,
      total_concluidos: 0,
      ticket_medio: null,
      total_pendentes: 0,
    },
    recebimento_por_metodo: [
      { origem: 'manual', metodo: 'dinheiro', valor: 250 },
    ],
  };
  const sinal = (id: string): SinalRetidoResponseDto => ({
    agendamento_id: id,
    ocorreu_em: '2026-09-10T15:00:00.000Z',
    cliente: { id: 'cliente', nome: 'Ana' },
    procedimento: { id: 'corte', nome: 'Corte' },
    valor: 10,
    motivo: 'cancelamento_cliente',
  });
  const responder = (input: {
    url: string;
    dados?: unknown;
    erro?: ApiError;
  }) => {
    const pedido = pedidos.filter((p) => p.url === input.url).at(-1)!;
    if (input.erro) pedido.resposta.error(input.erro);
    else {
      pedido.resposta.next(input.dados);
      pedido.resposta.complete();
    }
  };
  beforeEach(() => {
    pedidos = [];
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.callFake((url: string, options?: { params?: unknown }) => {
      const resposta = new Subject<unknown>();
      pedidos.push({ url, params: options?.params, resposta });
      return resposta.asObservable() as never;
    });
    injector = createEnvironmentInjector(
      [{ provide: HttpClient, useValue: http }],
      null as never,
    );
    service = runInInjectionContext(injector, () => new FaturamentoService());
  });

  afterEach(() => injector.destroy());

  async function iniciar() {
    const consulta = service.consultarPeriodo({ periodo: 'mes_atual' });
    responder({ url: '/faturamento', dados: resumo });
    await Promise.resolve();
    responder({
      url: '/faturamento/atendimentos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [],
        proximo_cursor: null,
      },
    });
    responder({
      url: '/faturamento/sinais-retidos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [sinal('a')],
        proximo_cursor: 'cursor-20',
      },
    });
    await consulta;
  }

  it('usa o período resolvido nas listas e mantém o total do período inteiro', async () => {
    await iniciar();
    expect(
      pedidos.find((p) => p.url === '/faturamento/sinais-retidos')?.params,
    ).toEqual(periodo);
    expect(service.sinaisRetidos().length).toBe(1);
    expect(service.faturamento()?.resumo.total_faturado).toBe(250);
    expect(service.estadoPagina()).toBe('relatorio');
  });

  it('acumula sem duplicar IDs, encerra a página e não altera o resumo', async () => {
    await iniciar();
    const consulta = service.carregarMaisSinaisRetidos();
    expect(pedidos.at(-1)?.params).toEqual({ ...periodo, cursor: 'cursor-20' });
    responder({
      url: '/faturamento/sinais-retidos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [sinal('a'), sinal('b'), sinal('b')],
        proximo_cursor: null,
      },
    });
    await consulta;
    expect(service.sinaisRetidos().map((s) => s.agendamento_id)).toEqual([
      'a',
      'b',
    ]);
    expect(service.proximoCursorSinaisRetidos()).toBeNull();
    expect(service.faturamento()?.resumo.total_faturado).toBe(250);
    const quantidade = pedidos.length;
    await service.carregarMaisSinaisRetidos();
    expect(pedidos.length).toBe(quantidade);
  });

  it('preserva itens e cursor na falha e permite repetir a próxima página', async () => {
    await iniciar();
    const consulta = service.carregarMaisSinaisRetidos();
    responder({
      url: '/faturamento/sinais-retidos',
      erro: new ApiError('Falha.', 503, null),
    });
    await consulta;
    expect(service.erroPaginacaoSinaisRetidos()).toBe('Falha.');
    expect(service.proximoCursorSinaisRetidos()).toBe('cursor-20');
    expect(service.sinaisRetidos().length).toBe(1);
    const tentativa = service.carregarMaisSinaisRetidos();
    responder({
      url: '/faturamento/sinais-retidos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [sinal('b')],
        proximo_cursor: null,
      },
    });
    await tentativa;
    expect(service.sinaisRetidos().length).toBe(2);
    expect(service.erroPaginacaoSinaisRetidos()).toBeNull();
  });

  it('descarta página antiga quando o período muda', async () => {
    await iniciar();
    const antiga = service.carregarMaisSinaisRetidos();
    const respostaAntiga = pedidos.at(-1)!.resposta;
    const atual = service.consultarPeriodo({ periodo: 'semana_atual' });
    expect(service.sinaisRetidos()).toEqual([]);
    responder({ url: '/faturamento', dados: resumo });
    await Promise.resolve();
    responder({
      url: '/faturamento/atendimentos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [],
        proximo_cursor: null,
      },
    });
    responder({
      url: '/faturamento/sinais-retidos',
      dados: {
        fuso_horario: resumo.fuso_horario,
        itens: [sinal('novo')],
        proximo_cursor: null,
      },
    });
    await atual;
    respostaAntiga.next({
      fuso_horario: resumo.fuso_horario,
      itens: [sinal('antigo')],
      proximo_cursor: 'antigo',
    });
    await antiga;
    expect(service.sinaisRetidos().map((s) => s.agendamento_id)).toEqual([
      'novo',
    ]);
    expect(service.proximoCursorSinaisRetidos()).toBeNull();
  });

  it('descarta resposta após sair da tela', async () => {
    await iniciar();
    const consulta = service.carregarMaisSinaisRetidos();
    const resposta = pedidos.at(-1)!.resposta;
    service.encerrarConsulta();
    resposta.next({ itens: [sinal('antigo')], proximo_cursor: null });
    await consulta;
    expect(service.sinaisRetidos()).toEqual([]);
    expect(service.proximoCursorSinaisRetidos()).toBeNull();
  });
});
