import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
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
export class MeusAgendamentosComponent {
  readonly agendamentos = input.required<AgendamentoClienteResponseDto[]>();
  readonly fusoHorario = input.required<string>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly detalhe = input<AgendamentoPublicoDetalheResponseDto | null>(null);
  readonly carregandoDetalhe = input(false);
  readonly referencias = input<ReferenciaAgendamentoVisual[]>([]);
  readonly carregandoReferencias = input(false);
  readonly erroReferencias = input<string | null>(null);
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
