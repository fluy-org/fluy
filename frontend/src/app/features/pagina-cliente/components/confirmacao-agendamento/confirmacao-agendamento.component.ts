import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
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
import {
  LIMITE_REFERENCIAS_POR_AGENDAMENTO,
  TAMANHO_MAXIMO_REFERENCIA_BYTES,
  TIPOS_REFERENCIA_ACEITOS,
} from '@app/features/pagina-cliente/pagina-cliente-data';

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
  readonly confirmar = output<File[]>();
  readonly seletorArquivo =
    viewChild<ElementRef<HTMLInputElement>>('seletorReferencia');
  readonly referencias = signal<ReferenciaSelecionada[]>([]);
  readonly erroReferencia = signal<string | null>(null);
  readonly limiteReferencias = LIMITE_REFERENCIAS_POR_AGENDAMENTO;

  ngOnDestroy(): void {
    this.referencias().forEach(({ url }) => URL.revokeObjectURL(url));
  }

  abrirSeletor(): void {
    this.seletorArquivo()?.nativeElement.click();
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
    this.confirmar.emit(this.referencias().map(({ arquivo }) => arquivo));
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
