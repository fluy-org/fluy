import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  AgendamentoClienteResponseDto,
  AgendamentoPublicoDetalheResponseDto,
  EstadoAgendamento,
} from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonImg,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { ESTILO_ESTADO_AGENDAMENTO } from '@app/shared/utils/estado-agendamento';
import { formatarValor } from '@app/shared/utils/formatacao';
import { HoraSalaoPipe } from '@app/shared/pipes/hora-salao.pipe';
import type { ReferenciaAgendamentoVisual } from '@app/features/pagina-cliente/contracts';
import {
  LIMITE_REFERENCIAS_POR_AGENDAMENTO,
  TAMANHO_MAXIMO_REFERENCIA_BYTES,
  TIPOS_REFERENCIA_ACEITOS,
} from '@app/features/pagina-cliente/pagina-cliente-data';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonImg,
    IonSpinner,
    IonText,
    HoraSalaoPipe,
  ],
  templateUrl: './meus-agendamentos.component.html',
  styleUrls: ['./meus-agendamentos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeusAgendamentosComponent implements OnDestroy {
  readonly agendamentos = input.required<AgendamentoClienteResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly detalhe = input<AgendamentoPublicoDetalheResponseDto | null>(null);
  readonly carregandoDetalhe = input(false);
  readonly referencias = input<ReferenciaAgendamentoVisual[]>([]);
  readonly carregandoReferencias = input(false);
  readonly erroReferencias = input<string | null>(null);
  readonly enviandoReferencias = input(false);
  readonly confirmandoCancelamento = input(false);
  readonly cancelando = input(false);
  readonly erroCancelamento = input<string | null>(null);
  readonly contatoWhatsapp = input<string | null>(null);

  readonly voltar = output<void>();
  readonly selecionar = output<string>();
  readonly fecharDetalhe = output<void>();
  readonly solicitarCancelamento = output<void>();
  readonly desistirCancelamento = output<void>();
  readonly confirmarCancelamento = output<void>();
  readonly pagarReserva = output<string>();
  readonly tentarNovamente = output<void>();
  readonly salvarReferencias = output<File[]>();

  readonly seletorArquivo =
    viewChild<ElementRef<HTMLInputElement>>('seletorReferencia');
  readonly novasReferencias = signal<{ arquivo: File; url: string }[]>([]);
  readonly erroNovaReferencia = signal<string | null>(null);
  readonly limiteReferencias = LIMITE_REFERENCIAS_POR_AGENDAMENTO;

  constructor() {
    effect(() => {
      this.detalhe();
      this.limparNovasReferencias();
    });

    let estavaEnviando = false;
    effect(() => {
      const enviando = this.enviandoReferencias();
      if (estavaEnviando && !enviando && !this.erroReferencias()) {
        this.limparNovasReferencias();
      }
      estavaEnviando = enviando;
    });
  }

  limparNovasReferencias(): void {
    this.novasReferencias().forEach(({ url }) => URL.revokeObjectURL(url));
    this.novasReferencias.set([]);
    this.erroNovaReferencia.set(null);
  }

  ngOnDestroy(): void {
    this.limparNovasReferencias();
  }

  abrirSeletor(): void {
    this.seletorArquivo()?.nativeElement.click();
  }

  selecionarNovasReferencias(evento: Event): void {
    const seletor = evento.target as HTMLInputElement;
    const arquivos = Array.from(seletor.files ?? []);
    seletor.value = '';
    this.erroNovaReferencia.set(null);

    const totalAtual =
      this.referencias().length + this.novasReferencias().length;
    let adicionadas = 0;

    for (const arquivo of arquivos) {
      if (totalAtual + adicionadas >= LIMITE_REFERENCIAS_POR_AGENDAMENTO) {
        this.erroNovaReferencia.set(
          `Você pode adicionar até ${LIMITE_REFERENCIAS_POR_AGENDAMENTO} imagens de referência no total.`,
        );
        break;
      }
      if (!TIPOS_REFERENCIA_ACEITOS.includes(arquivo.type)) {
        this.erroNovaReferencia.set('Selecione imagens JPEG, PNG ou WebP.');
        continue;
      }
      if (arquivo.size > TAMANHO_MAXIMO_REFERENCIA_BYTES) {
        this.erroNovaReferencia.set('Cada imagem deve ter no máximo 5 MiB.');
        continue;
      }
      this.novasReferencias.update((atuais) => [
        ...atuais,
        { arquivo, url: URL.createObjectURL(arquivo) },
      ]);
      adicionadas++;
    }
  }

  removerNovaReferencia(indice: number): void {
    const ref = this.novasReferencias()[indice];
    if (ref) {
      URL.revokeObjectURL(ref.url);
      this.novasReferencias.update((atuais) =>
        atuais.filter((_, i) => i !== indice),
      );
      this.erroNovaReferencia.set(null);
    }
  }

  enviarNovasReferencias(): void {
    const arquivos = this.novasReferencias().map((item) => item.arquivo);
    if (!arquivos.length) return;
    this.salvarReferencias.emit(arquivos);
  }

  obterRotuloEstado(estado: EstadoAgendamento): string {
    return ESTILO_ESTADO_AGENDAMENTO[estado].rotulo;
  }

  obterCorEstado(estado: EstadoAgendamento): string {
    return ESTILO_ESTADO_AGENDAMENTO[estado].cor;
  }

  ehReservaExpirada(item: { estado: string; motivo_cancelamento?: string | null }): boolean {
    return item.estado === 'cancelado' && item.motivo_cancelamento === 'Reserva expirada.';
  }

  ehPagoAposPrazo(item: { situacao_pagamento?: string | null }): boolean {
    return item.situacao_pagamento === 'confirmado_apos_expiracao';
  }

  obterRotuloExibicao(item: {
    estado: EstadoAgendamento;
    situacao_pagamento?: string | null;
    motivo_cancelamento?: string | null;
  }): string {
    if (this.ehPagoAposPrazo(item)) return 'Pago após o prazo';
    if (this.ehReservaExpirada(item)) return 'Reserva expirada';
    return this.obterRotuloEstado(item.estado);
  }

  obterCorExibicao(item: {
    estado: EstadoAgendamento;
    situacao_pagamento?: string | null;
    motivo_cancelamento?: string | null;
  }): string {
    if (this.ehPagoAposPrazo(item)) return 'warning';
    if (this.ehReservaExpirada(item)) return 'medium';
    return this.obterCorEstado(item.estado);
  }

  obterUrlWhatsapp(numero: string): string {
    const limpo = numero.replace(/\D/g, '');
    return limpo ? `https://wa.me/${limpo}` : '';
  }

  formatarDuracao(duracaoMin: number): string {
    const horas = Math.floor(duracaoMin / 60);
    const minutos = duracaoMin % 60;

    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  }

  formatarPreco(valor: number): string {
    return formatarValor(valor);
  }
}
