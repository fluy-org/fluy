import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ProcedimentoPublicoResponseDto,
  SalaoPublicoResponseDto,
} from '@fluy/schema';
import { IonButton, IonIcon, IonImg, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  radioButtonOff,
  radioButtonOn,
} from 'ionicons/icons';
import {
  LIMITE_REFERENCIAS_POR_AGENDAMENTO,
  TAMANHO_MAXIMO_REFERENCIA_BYTES,
  TIPOS_REFERENCIA_ACEITOS,
} from '@app/features/pagina-cliente/pagina-cliente-data';

export type ConfirmacaoAgendamentoEvento = {
  referencias: File[];
  opcaoPagamento: 'online' | 'no_salao';
};

type ReferenciaSelecionada = {
  arquivo: File;
  url: string;
};

@Component({
  selector: 'app-confirmacao-agendamento',
  standalone: true,
  imports: [IonButton, IonIcon, IonImg, IonText],
  templateUrl: './confirmacao-agendamento.component.html',
  styleUrls: ['./confirmacao-agendamento.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacaoAgendamentoComponent implements OnDestroy {
  readonly salao = input.required<SalaoPublicoResponseDto>();
  readonly procedimento = input.required<ProcedimentoPublicoResponseDto>();
  readonly data = input.required<string>();
  readonly hora = input.required<string>();
  readonly salvando = input(false);
  readonly erro = input<string | null>(null);

  readonly voltar = output<void>();
  readonly confirmar = output<ConfirmacaoAgendamentoEvento>();
  readonly seletorArquivo =
    viewChild<ElementRef<HTMLInputElement>>('seletorReferencia');
  readonly referencias = signal<ReferenciaSelecionada[]>([]);
  readonly erroReferencia = signal<string | null>(null);
  readonly limiteReferencias = LIMITE_REFERENCIAS_POR_AGENDAMENTO;

  readonly opcaoPagamento = signal<'online' | 'no_salao'>('online');

  readonly podeEscolherPagamento = computed(() => {
    return (
      this.salao().pagamento_online_disponivel &&
      this.procedimento().valor_sinal > 0 &&
      this.procedimento().politica_sinal === 'opcional'
    );
  });

  readonly devePagarNoSalao = computed(() => {
    if (!this.salao().pagamento_online_disponivel) return true;
    if (this.procedimento().valor_sinal === 0) return true;
    if (this.podeEscolherPagamento() && this.opcaoPagamento() === 'no_salao') return true;
    return false;
  });

  readonly textoBotaoConfirmar = computed(() => {
    if (this.salvando()) return 'Preparando...';
    if (this.devePagarNoSalao()) {
      if (this.procedimento().valor_sinal === 0) {
        return 'Confirmar sem pagamento antecipado';
      }
      return 'Confirmar agendamento (pagar no salão)';
    }
    return 'Reservar e ir ao pagamento';
  });

  constructor() {
    addIcons({
      informationCircleOutline,
      radioButtonOff,
      radioButtonOn,
    });
  }

  ngOnDestroy(): void {
    this.referencias().forEach(({ url }) => URL.revokeObjectURL(url));
  }

  abrirSeletor(): void {
    this.seletorArquivo()?.nativeElement.click();
  }

  selecionarOpcaoPagamento(opcao: 'online' | 'no_salao'): void {
    this.opcaoPagamento.set(opcao);
  }

  selecionarReferencias(evento: Event): void {
    const seletor = evento.target as HTMLInputElement;
    const arquivos = Array.from(seletor.files ?? []);
    seletor.value = '';
    this.erroReferencia.set(null);

    for (const arquivo of arquivos) {
      if (this.referencias().length >= LIMITE_REFERENCIAS_POR_AGENDAMENTO) {
        this.erroReferencia.set('Você pode adicionar até 3 imagens.');
        break;
      }

      if (!TIPOS_REFERENCIA_ACEITOS.includes(arquivo.type)) {
        this.erroReferencia.set('Selecione imagens JPEG, PNG ou WebP.');
        continue;
      }

      if (arquivo.size > TAMANHO_MAXIMO_REFERENCIA_BYTES) {
        this.erroReferencia.set('Cada imagem deve ter no máximo 5 MiB.');
        continue;
      }

      this.referencias.update((atuais) => [
        ...atuais,
        { arquivo, url: URL.createObjectURL(arquivo) },
      ]);
    }
  }

  removerReferencia(indice: number): void {
    const referencia = this.referencias()[indice];
    if (!referencia) return;

    URL.revokeObjectURL(referencia.url);
    this.referencias.update((atuais) =>
      atuais.filter((_, indiceAtual) => indiceAtual !== indice),
    );
    this.erroReferencia.set(null);
  }

  confirmarAgendamento(): void {
    const opcaoFinal = this.devePagarNoSalao() ? 'no_salao' : 'online';
    this.confirmar.emit({
      referencias: this.referencias().map(({ arquivo }) => arquivo),
      opcaoPagamento: opcaoFinal,
    });
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(
      new Date(ano!, mes! - 1, dia),
    );
  }

  formatarPreco(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}
