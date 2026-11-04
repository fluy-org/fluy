import { ErroCheckout } from '@app/features/pagina-cliente/contracts';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ApiError } from '@app/core/errors/api-error';
import {
  INTERVALO_CONSULTA_PAGAMENTO_MS,
  LIMITE_CONSULTAS_PAGAMENTO,
} from '@app/features/pagina-cliente/checkout-data';
import {
  iniciarPagamentoPixSchema,
  reservaPixResponseSchema,
} from '@fluy/schema';
import type {
  PagamentoPixResponseDto,
  IniciarPagamentoPixDto,
  InstituicoesPixResponseDto,
  RecebimentoPixPublicoResponseDto,
  SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import type {
  ContextoCheckout,
  ReservarCheckoutInput,
} from '@app/features/pagina-cliente/contracts';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly _contexto = signal<ContextoCheckout | null>(null);
  private readonly _pagamento = signal<PagamentoPixResponseDto | null>(null);
  readonly contexto = this._contexto.asReadonly();
  readonly pagamento = this._pagamento.asReadonly();
  private readonly _instituicoes = signal<InstituicoesPixResponseDto>([]);
  readonly instituicoes = this._instituicoes.asReadonly();
  private geracao = 0;
  private readonly cancelamento = new Subject<void>();
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  private consultaEmCurso: Promise<void> | null = null;
  private readonly _erroConsulta = signal<string | null>(null);
  readonly erroConsulta = this._erroConsulta.asReadonly();
  private credencial = '';
  private iniciacaoEmCurso: Promise<void> | null = null;
  private geracaoIniciacao = -1;
  private reservaEmCurso: Promise<ContextoCheckout> | null = null;
  private chaveReservaEmCurso = '';

  reservar(input: ReservarCheckoutInput): Promise<ContextoCheckout> {
    const chave = JSON.stringify({ input, geracao: this.geracao });
    if (this.reservaEmCurso && this.chaveReservaEmCurso === chave)
      return this.reservaEmCurso;
    const promessa = this.criarReserva({
      ...input,
      geracao: this.geracao,
    }).finally(() => {
      if (this.reservaEmCurso === promessa) this.reservaEmCurso = null;
    });
    this.chaveReservaEmCurso = chave;
    this.reservaEmCurso = promessa;
    return promessa;
  }

  private async criarReserva(
    input: ReservarCheckoutInput & { geracao: number },
  ): Promise<ContextoCheckout> {
    const reserva = await firstValueFrom(
      this.http.post<ContextoCheckout['reserva']>(
        '/publico/s/' + encodeURIComponent(input.subdominio) + '/reservas',
        input.dados,
      ),
    );
    const contexto = {
      subdominio: input.subdominio,
      nomeProcedimento: input.nomeProcedimento,
      reserva,
      vinculo: await this.vincularDispositivo(input.dados.credencial),
    };
    this.salvarContexto(contexto);
    if (input.geracao === this.geracao) {
      this.credencial = input.dados.credencial;
      this._contexto.set(contexto);
      this._pagamento.set(null);
    }
    return contexto;
  }

  listarContextos(): ContextoCheckout[] {
    const contextos: ContextoCheckout[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (!chave?.startsWith('fluy:checkout:')) continue;
      try {
        const item = JSON.parse(
          localStorage.getItem(chave) ?? 'null',
        ) as ContextoCheckout | null;
        if (
          !item ||
          !/^[a-f0-9]{64}$/.test(item.vinculo) ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.subdominio) ||
          typeof item.nomeProcedimento !== 'string'
        )
          continue;
        const reserva = reservaPixResponseSchema.safeParse(item.reserva);
        if (
          !reserva.success ||
          chave !==
            this.chave({ subdominio: item.subdominio, id: reserva.data.id })
        )
          continue;
        if (
          item.tentativa !== undefined &&
          item.tentativa !== 'sinal' &&
          item.tentativa !== 'total'
        )
          continue;
        contextos.push({ ...item, reserva: reserva.data });
      } catch {
        continue;
      }
    }
    return contextos;
  }

  private chave(input: { subdominio: string; id: string }): string {
    return 'fluy:checkout:' + input.subdominio + ':' + input.id;
  }

  private salvarContexto(contexto: ContextoCheckout): void {
    localStorage.setItem(
      this.chave({ subdominio: contexto.subdominio, id: contexto.reserva.id }),
      JSON.stringify(contexto),
    );
  }

  registrarReferenciasPendentes(input: {
    subdominio: string;
    id: string;
    pendentes: boolean;
  }): void {
    const atual = this._contexto();
    const mesmoContexto =
      atual?.subdominio === input.subdominio && atual.reserva.id === input.id;
    const contexto = mesmoContexto
      ? atual
      : this.listarContextos().find(
          (item) =>
            item.subdominio === input.subdominio &&
            item.reserva.id === input.id,
        );
    if (!contexto) return;
    const atualizado = { ...contexto, referenciasPendentes: input.pendentes };
    this.salvarContexto(atualizado);
    if (mesmoContexto) this._contexto.set(atualizado);
  }

  private base(): string {
    const contexto = this._contexto();
    if (!contexto) throw new ErroCheckout('Retome sua reserva para continuar.');
    return (
      '/publico/s/' + encodeURIComponent(contexto.subdominio) + '/reservas'
    );
  }

  async carregarInstituicoes(): Promise<void> {
    const geracao = this.geracao;
    const dados = await firstValueFrom(
      this.http.get<InstituicoesPixResponseDto>(this.base() + '/instituicoes'),
    );
    if (geracao === this.geracao) this._instituicoes.set(dados);
  }

  consultarRecebedor(): Promise<RecebimentoPixPublicoResponseDto> {
    return firstValueFrom(
      this.http.get<RecebimentoPixPublicoResponseDto>(
        this.base() + '/checkout',
      ),
    );
  }

  iniciar(input: Omit<IniciarPagamentoPixDto, 'credencial'>): Promise<void> {
    if (this.iniciacaoEmCurso && this.geracaoIniciacao === this.geracao)
      return this.iniciacaoEmCurso;
    const promessa = this.prepararPagamento(input).finally(() => {
      if (this.iniciacaoEmCurso === promessa) this.iniciacaoEmCurso = null;
    });
    this.geracaoIniciacao = this.geracao;
    this.iniciacaoEmCurso = promessa;
    return promessa;
  }

  private async prepararPagamento(
    input: Omit<IniciarPagamentoPixDto, 'credencial'>,
  ): Promise<void> {
    const contexto = this._contexto();
    if (!contexto) throw new ErroCheckout('Retome sua reserva para continuar.');
    const dados = iniciarPagamentoPixSchema.parse({
      ...input,
      credencial: this.credencial,
    });
    if (contexto.tentativa && contexto.tentativa !== dados.modalidade)
      throw new ErroCheckout(
        'Consulte ou continue a tentativa anterior antes de trocar a modalidade.',
      );
    const atualizado = { ...contexto, tentativa: dados.modalidade };
    this.salvarContexto(atualizado);
    this._contexto.set(atualizado);
    const geracao = this.geracao;
    const pagamento = await firstValueFrom(
      this.http.post<PagamentoPixResponseDto>(
        this.base() +
          '/' +
          encodeURIComponent(contexto.reserva.id) +
          '/pagamentos',
        dados,
      ),
    );
    if (geracao === this.geracao) this.aplicarPagamento(pagamento);
  }

  async retomar(input: {
    subdominio: string;
    id: string;
    credencial: string;
  }): Promise<void> {
    this.limparContexto();
    const geracao = this.geracao;
    const contexto = this.listarContextos().find(
      (item) =>
        item.subdominio === input.subdominio && item.reserva.id === input.id,
    );
    if (!contexto || !input.credencial)
      throw new ErroCheckout(
        'Não foi possível recuperar esta reserva neste dispositivo. Fale com o salão.',
      );
    if ((await this.vincularDispositivo(input.credencial)) !== contexto.vinculo)
      throw new ErroCheckout(
        'Esta reserva pertence a outra identificação. Fale com o salão.',
      );
    if (geracao !== this.geracao) return;
    const sessao = await firstValueFrom(
      this.http.get<SessaoClientePublicaResponseDto>(
        '/publico/s/' +
          encodeURIComponent(input.subdominio) +
          '/cliente/sessao',
        { params: { credencial: input.credencial } },
      ),
    );
    if (geracao !== this.geracao) return;
    if (!sessao.cliente)
      throw new ErroCheckout(
        'Esta reserva pertence a outra identificação. Fale com o salão.',
      );
    this.credencial = input.credencial;
    this._contexto.set(contexto);
    try {
      await this.consultar();
    } catch (erro) {
      if (
        erro instanceof ApiError &&
        erro.status === 404 &&
        !contexto.tentativa
      ) {
        this._erroConsulta.set(null);
        return;
      }
      throw erro;
    }
  }

  consultar(): Promise<void> {
    if (this.consultaEmCurso) return this.consultaEmCurso;
    const geracao = this.geracao;
    const promessa = this.buscarPagamento(geracao).finally(() => {
      if (geracao === this.geracao) this.consultaEmCurso = null;
    });
    this.consultaEmCurso = promessa;
    return promessa;
  }

  private async buscarPagamento(geracao: number): Promise<void> {
    const contexto = this._contexto();
    if (!contexto) throw new ErroCheckout('Retome sua reserva para consultar.');
    try {
      const pagamento = await firstValueFrom(
        this.http
          .get<PagamentoPixResponseDto>(
            this.base() +
              '/' +
              encodeURIComponent(contexto.reserva.id) +
              '/pagamento',
            { params: { credencial: this.credencial } },
          )
          .pipe(takeUntil(this.cancelamento)),
      );
      if (geracao !== this.geracao) return;
      this.aplicarPagamento(pagamento);
      this._erroConsulta.set(null);
      if (pagamento.status === 'falhou' || pagamento.status === 'expirada') {
        const atualizado = { ...contexto };
        delete atualizado.tentativa;
        this.salvarContexto(atualizado);
        this._contexto.set(atualizado);
      }
    } catch (erro) {
      if (geracao !== this.geracao) return;
      if (erro instanceof ApiError) {
        this._erroConsulta.set(
          erro.status === 0
            ? 'Não foi possível consultar. O resultado pode estar pendente; não faça outro pagamento.'
            : erro.message,
        );
        if (erro.status === 401 || erro.status === 403 || erro.status === 404)
          this.parar();
      }
      throw erro;
    }
  }

  acompanhar(): void {
    if (this.temporizador !== undefined) clearTimeout(this.temporizador);
    const geracao = this.geracao;
    const ciclo = async (contagem: number): Promise<void> => {
      try {
        await this.consultar();
      } catch (erro) {
        if (!(erro instanceof ApiError)) throw erro;
      }
      if (geracao !== this.geracao) return;
      const pagamento = this._pagamento();
      if (
        pagamento &&
        pagamento.status !== 'pendente' &&
        pagamento.status !== 'iniciando'
      )
        return;
      if (contagem >= LIMITE_CONSULTAS_PAGAMENTO) {
        this._erroConsulta.set(
          'A confirmação está demorando. Atualize a situação antes de tentar pagar novamente.',
        );
        return;
      }
      this.temporizador = setTimeout(() => {
        void ciclo(contagem + 1);
      }, INTERVALO_CONSULTA_PAGAMENTO_MS);
    };
    void ciclo(1);
  }

  private aplicarPagamento(pagamento: PagamentoPixResponseDto): void {
    const atual = this._pagamento();
    if (atual?.id === pagamento.id && atual.status === 'confirmada') return;
    this._pagamento.set(pagamento);
  }

  private async vincularDispositivo(credencial: string): Promise<string> {
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(credencial),
    );
    return Array.from(new Uint8Array(hash), (valor) =>
      valor.toString(16).padStart(2, '0'),
    ).join('');
  }

  limparContexto(): void {
    this.parar();
    this._contexto.set(null);
    this._pagamento.set(null);
    this._instituicoes.set([]);
    this._erroConsulta.set(null);
    this.credencial = '';
  }

  parar(): void {
    this.geracao++;
    this.cancelamento.next();
    if (this.temporizador !== undefined) clearTimeout(this.temporizador);
    this.temporizador = undefined;
    this.consultaEmCurso = null;
  }
}
