import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { ProcedimentoPublicoResponseDto } from '@fluy/schema';
import {
  IonButton,
  IonCard,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircle,
  logoWhatsapp,
  sparklesOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-catalogo-procedimentos',
  standalone: true,
  imports: [IonButton, IonCard, IonIcon, IonSpinner, IonText],
  templateUrl: './catalogo-procedimentos.component.html',
  styleUrls: ['./catalogo-procedimentos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoProcedimentosComponent {
  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircle,
      logoWhatsapp,
      sparklesOutline,
    });
  }

  readonly procedimentos = input.required<ProcedimentoPublicoResponseDto[]>();
  readonly procedimentoSelecionadoId = input<string | null>(null);
  readonly contatoWhatsapp = input<string | null | undefined>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly pagamentoOnlineDisponivel = input(true);

  readonly selecionar = output<ProcedimentoPublicoResponseDto>();

  readonly urlWhatsapp = computed(() => {
    const zap = this.contatoWhatsapp();
    if (!zap) return '';
    let digitos = zap.replace(/\D/g, '');
    if (digitos.length === 10 || digitos.length === 11) {
      digitos = `55${digitos}`;
    }
    const texto = encodeURIComponent('Olá, gostaria de informações sobre agendamento.');
    return `https://wa.me/${digitos}?text=${texto}`;
  });

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  formatarDuracao(duracaoMin: number): string {
    const horas = Math.floor(duracaoMin / 60);
    const minutos = duracaoMin % 60;

    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas}h`;

    return `${horas}h ${minutos}min`;
  }
}
