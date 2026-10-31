import type { PagamentoPixResponseDto } from '@fluy/schema';
import { HttpClient } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { CheckoutService } from './checkout.service';
import { ApiError } from '@app/core/errors/api-error';
const reserva = {
  id: '01010101-0101-4010-8010-010101010101',
  cliente_id: '02020202-0202-4020-8020-020202020202',
  profissional_id: '03030303-0303-4030-8030-030303030303',
  procedimento_id: '04040404-0404-4040-8040-040404040404',
  inicio_em: '2030-01-02T13:00:00.000Z',
  duracao_min: 30,
  preco_total: 100,
  valor_sinal: 25,
  estado: 'reservado' as const,
  criado_em: '2030-01-01T00:00:00.000Z',
  expira_em: '2030-01-01T00:15:00.000Z',
};
const entrada = {
  subdominio: 'salao-a',
  nomeProcedimento: 'Corte',
  dados: {
    credencial: '05050505-0505-4050-8050-050505050505',
    procedimento_id: reserva.procedimento_id,
    data: '2030-01-02',
    hora_inicio: '10:00',
    confirmar_excecoes: false,
  },
};

describe('Checkout: reserva', () => {
  let http: jasmine.SpyObj<HttpClient>;
  let service: CheckoutService;
  beforeEach(() => {
    const valores = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => valores.get(k) ?? null,
        setItem: (k: string, v: string) => valores.set(k, v),
        removeItem: (k: string) => valores.delete(k),
        key: (i: number) => [...valores.keys()][i] ?? null,
        get length() {
          return valores.size;
        },
      },
    });
    http = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    service = runInInjectionContext(
      Injector.create({ providers: [{ provide: HttpClient, useValue: http }] }),
      () => new CheckoutService(),
    );
  });
  afterEach(() => service.parar());
  it('reserva uma vez por ação e congela valores do servidor', async () => {
    const resposta = new Subject<typeof reserva>();
    http.post.and.returnValue(resposta);
    const a = service.reservar(entrada);
    const b = service.reservar(entrada);
    expect(http.post.calls.count()).toBe(1);
    resposta.next(reserva);
    resposta.complete();
    await Promise.all([a, b]);
    expect(service.contexto()?.reserva.valor_sinal).toBe(25);
    expect(service.pagamento()).toBeNull();
    expect(http.post).toHaveBeenCalledWith(
      '/publico/s/salao-a/reservas',
      entrada.dados,
    );
    expect(service.listarContextos().length).toBe(1);
    expect(service.contexto()?.vinculo).toMatch(/^[a-f0-9]{64}$/);
  });
  it('conflito de slot não cria contexto nem inicia pagamento', async () => {
    http.post.and.returnValue(
      throwError(() => new ApiError('Ocupado.', 409, {})),
    );
    await expectAsync(service.reservar(entrada)).toBeRejected();
    expect(service.contexto()).toBeNull();
    expect(http.post.calls.count()).toBe(1);
    expect(service.listarContextos()).toEqual([]);
  });

  const pagamento: PagamentoPixResponseDto = {
    nome_recebedor: 'Salão',
    id: '06060606-0606-4060-8060-060606060606',
    status: 'pendente' as const,
    modalidade: 'total' as const,
    valor_salao: 100,
    taxa_cliente: 3,
    total_cliente: 103,
    expira_em: reserva.expira_em,
    situacao: 'normal' as const,
    instrucao_cliente: {
      tipo: 'url' as const,
      valor: 'https://banco.example/autorizar',
    },
  };
  const pagador = { cpf: '51687574219', instituicao_id: 'banco-a' };
  async function reservar() {
    http.post.and.returnValue(of(reserva));
    await service.reservar(entrada);
    http.post.calls.reset();
  }
  it('prepara total canônico antes da autorização e impede cliques duplos', async () => {
    await reservar();
    const resposta = new Subject<typeof pagamento>();
    http.post.and.returnValue(resposta);
    const a = service.iniciar({ modalidade: 'total', pagador });
    const b = service.iniciar({ modalidade: 'total', pagador });
    expect(http.post.calls.count()).toBe(1);
    resposta.next(pagamento);
    resposta.complete();
    await Promise.all([a, b]);
    expect(service.pagamento()?.total_cliente).toBe(103);
    expect(http.post).toHaveBeenCalledWith(
      '/publico/s/salao-a/reservas/' + reserva.id + '/pagamentos',
      { credencial: entrada.dados.credencial, modalidade: 'total', pagador },
    );
  });
  it('valida pagador pelo schema antes de enviar', async () => {
    await reservar();
    await expectAsync(
      service.iniciar({
        modalidade: 'sinal',
        pagador: { ...pagador, cpf: '123' },
      }),
    ).toBeRejected();
    expect(http.post).not.toHaveBeenCalled();
  });
  it('resultado incerto bloqueia troca de modalidade e continua a mesma reserva', async () => {
    await reservar();
    http.post.and.returnValue(
      throwError(() => new ApiError('Timeout.', 0, {})),
    );
    await expectAsync(
      service.iniciar({ modalidade: 'total', pagador }),
    ).toBeRejected();
    expect(service.contexto()?.tentativa).toBe('total');
    await expectAsync(
      service.iniciar({ modalidade: 'sinal', pagador }),
    ).toBeRejected();
    expect(http.post.calls.count()).toBe(1);
    http.post.and.returnValue(of(pagamento));
    await service.iniciar({ modalidade: 'total', pagador });
    expect(service.pagamento()?.id).toBe(pagamento.id);
  });
  it('falha de instituições permite retry sem inventar lista', async () => {
    await reservar();
    http.get.and.returnValue(
      throwError(() => new ApiError('Indisponível.', 503, {})),
    );
    await expectAsync(service.carregarInstituicoes()).toBeRejected();
    expect(service.instituicoes()).toEqual([]);
    http.get.and.returnValue(of([{ id: 'banco-a', nome: 'Banco A' }]));
    await service.carregarInstituicoes();
    expect(service.instituicoes()).toEqual([
      { id: 'banco-a', nome: 'Banco A' },
    ]);
  });

  it('retoma após recarga sem criar outra reserva e confirma só pelo backend', async () => {
    await reservar();
    http.post.and.returnValue(of(pagamento));
    await service.iniciar({ modalidade: 'total', pagador });
    service.parar();
    http.post.calls.reset();
    http.get.and.returnValues(
      of({ cliente: { nome: 'Cliente', whatsapp: '+5511999999999' } }),
      of(pagamento),
    );
    await service.retomar({
      subdominio: 'salao-a',
      id: reserva.id,
      credencial: entrada.dados.credencial,
    });
    expect(service.pagamento()?.status).toBe('pendente');
    expect(http.post).not.toHaveBeenCalled();
    http.get.and.returnValue(of({ ...pagamento, status: 'confirmada' }));
    await service.consultar();
    expect(service.pagamento()?.status).toBe('confirmada');
  });
  it('não recupera contexto de outro salão ou cliente', async () => {
    await reservar();
    await expectAsync(
      service.retomar({
        subdominio: 'outro',
        id: reserva.id,
        credencial: entrada.dados.credencial,
      }),
    ).toBeRejected();
    expect(http.get).not.toHaveBeenCalled();
    http.get.and.returnValue(
      of({ cliente: { nome: 'Outra', whatsapp: '+5511999999999' } }),
    );
    await expectAsync(
      service.retomar({
        subdominio: 'salao-a',
        id: reserva.id,
        credencial: '07070707-0707-4070-8070-070707070707',
      }),
    ).toBeRejected();
    expect(service.contexto()).toBeNull();
  });
  it('descarta resposta antiga ao sair e não sobrepõe consultas', async () => {
    await reservar();
    const resposta = new Subject<typeof pagamento>();
    http.get.and.returnValue(resposta);
    const a = service.consultar();
    const b = service.consultar();
    expect(http.get.calls.count()).toBe(1);
    service.parar();
    resposta.next({ ...pagamento, status: 'confirmada' });
    resposta.complete();
    await Promise.all([a, b]);
    expect(service.pagamento()).toBeNull();
  });
  it('erro de rede preserva pendência e confirmação tardia mantém divergência', async () => {
    await reservar();
    http.post.and.returnValue(of(pagamento));
    await service.iniciar({ modalidade: 'total', pagador });
    http.get.and.returnValue(
      throwError(() => new ApiError('Sem rede.', 0, {})),
    );
    await expectAsync(service.consultar()).toBeRejected();
    expect(service.pagamento()?.status).toBe('pendente');
    http.get.and.returnValue(
      of({
        ...pagamento,
        status: 'confirmada',
        situacao: 'confirmado_apos_expiracao',
      }),
    );
    await service.consultar();
    expect(service.pagamento()?.situacao).toBe('confirmado_apos_expiracao');
  });
  it('polling aguarda resposta, termina ao confirmar e cancela ao sair', async () => {
    jasmine.clock().install();
    try {
      await reservar();
      const resposta = new Subject<typeof pagamento>();
      http.get.and.returnValue(resposta);
      service.acompanhar();
      jasmine.clock().tick(15000);
      expect(http.get.calls.count()).toBe(1);
      resposta.next({ ...pagamento, status: 'confirmada' } as typeof pagamento);
      resposta.complete();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jasmine.clock().tick(15000);
      expect(http.get.calls.count()).toBe(1);
      service.parar();
      jasmine.clock().tick(15000);
      expect(http.get.calls.count()).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('resposta de iniciação atrasada não rebaixa confirmação', async () => {
    await reservar();
    const resposta = new Subject<typeof pagamento>();
    http.post.and.returnValue(resposta);
    const iniciacao = service.iniciar({ modalidade: 'total', pagador });
    http.get.and.returnValue(of({ ...pagamento, status: 'confirmada' }));
    await service.consultar();
    resposta.next(pagamento);
    resposta.complete();
    await iniciacao;
    expect(service.pagamento()?.status).toBe('confirmada');
  });
  it('preserva aviso de referências que falharam ao retomar', async () => {
    await reservar();
    service.registrarReferenciasPendentes({
      subdominio: entrada.subdominio,
      id: reserva.id,
      pendentes: true,
    });
    expect(service.listarContextos()[0].referenciasPendentes).toBeTrue();
    service.registrarReferenciasPendentes({
      subdominio: entrada.subdominio,
      id: reserva.id,
      pendentes: false,
    });
    expect(service.listarContextos()[0].referenciasPendentes).toBeFalse();
  });
  for (const status of [401, 403, 404]) {
    it(
      'interrompe acompanhamento quando o acesso deixa de existir: ' + status,
      async () => {
        jasmine.clock().install();
        try {
          await reservar();
          http.get.and.returnValue(
            throwError(() => new ApiError('Acesso indisponível.', status, {})),
          );
          service.acompanhar();
          for (let i = 0; i < 6; i++) await Promise.resolve();
          jasmine.clock().tick(15000);
          expect(http.get.calls.count()).toBe(1);
        } finally {
          jasmine.clock().uninstall();
        }
      },
    );
  }

  it('inicia a reserva atual sem reutilizar a promise de outra reserva', async () => {
    await reservar();
    const respostaAnterior = new Subject<PagamentoPixResponseDto>();
    http.post.and.returnValue(respostaAnterior);
    const anterior = service.iniciar({ modalidade: 'total', pagador });
    service.parar();
    const reservaAtual = {
      ...reserva,
      id: '08080808-0808-4080-8080-080808080808',
    };
    http.post.and.returnValue(of(reservaAtual));
    await service.reservar(entrada);
    http.post.calls.reset();
    const pagamentoAtual = {
      ...pagamento,
      id: '09090909-0909-4090-8090-090909090909',
    };
    http.post.and.returnValue(of(pagamentoAtual));
    const atual = service.iniciar({ modalidade: 'total', pagador });
    expect(http.post.calls.count()).toBe(1);
    respostaAnterior.next(pagamento);
    respostaAnterior.complete();
    await Promise.all([anterior, atual]);
    expect(service.pagamento()?.id).toBe(pagamentoAtual.id);
  });
  it('uma reserva que responde tarde é guardada sem substituir o contexto retomado', async () => {
    await reservar();
    const respostaAnterior = new Subject<typeof reserva>();
    http.post.and.returnValue(respostaAnterior);
    const anterior = service.reservar(entrada);
    http.get.and.returnValues(
      of({ cliente: { nome: 'Cliente', whatsapp: '+5511999999999' } }),
      of(pagamento),
    );
    await service.retomar({
      subdominio: entrada.subdominio,
      id: reserva.id,
      credencial: entrada.dados.credencial,
    });
    const outraReserva = {
      ...reserva,
      id: '08080808-0808-4080-8080-080808080808',
    };
    respostaAnterior.next(outraReserva);
    respostaAnterior.complete();
    await anterior;
    expect(service.contexto()?.reserva.id).toBe(reserva.id);
    expect(service.listarContextos().length).toBe(2);
  });

  it('atualiza referências da reserva original sem contaminar outra reserva ativa', async () => {
    await reservar();
    const reservaAtual = {
      ...reserva,
      id: '08080808-0808-4080-8080-080808080808',
    };
    http.post.and.returnValue(of(reservaAtual));
    await service.reservar(entrada);
    service.registrarReferenciasPendentes({
      subdominio: entrada.subdominio,
      id: reserva.id,
      pendentes: true,
    });
    expect(service.contexto()?.reserva.id).toBe(reservaAtual.id);
    expect(service.contexto()?.referenciasPendentes).toBeUndefined();
    expect(
      service.listarContextos().find((item) => item.reserva.id === reserva.id)
        ?.referenciasPendentes,
    ).toBeTrue();
  });
  it('limpa o contexto visível sem perder as reservas que podem ser retomadas', async () => {
    await reservar();
    http.post.and.returnValue(of(pagamento));
    await service.iniciar({ modalidade: 'total', pagador });
    service.limparContexto();
    expect(service.contexto()).toBeNull();
    expect(service.pagamento()).toBeNull();
    expect(service.listarContextos().length).toBe(1);
  });
});
