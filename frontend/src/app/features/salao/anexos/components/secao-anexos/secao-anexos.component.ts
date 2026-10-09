import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonImg,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { ApiError } from '@app/core/errors/api-error';
import {
  LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TIPOS_ANEXO_ACEITOS,
} from '@app/features/salao/anexos/anexos-data';
import type { AnexoAgendamentoVisual } from '@app/features/salao/anexos/contracts';
import { AnexosAgendamentoService } from '@app/features/salao/anexos/services/anexos-agendamento.service';

@Component({
  selector: 'app-secao-anexos',
  templateUrl: './secao-anexos.component.html',
  styleUrls: ['./secao-anexos.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, IonImg, IonSpinner, IonText],
})
export class SecaoAnexosComponent implements OnInit, OnDestroy {
  private readonly anexosService = inject(AnexosAgendamentoService);
  private destruido = false;

  readonly agendamentoId = input.required<string>();
  readonly quantidadeAlterada = output<number>();
  readonly seletorArquivo = viewChild<ElementRef<HTMLInputElement>>('seletor');
  readonly anexos = signal<AnexoAgendamentoVisual[]>([]);
  readonly carregando = signal(true);
  readonly enviando = signal(false);
  readonly removendoId = signal<string | null>(null);
  readonly erro = signal<string | null>(null);

  readonly limite = LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO;

  constructor() {
    addIcons({ addOutline, trashOutline });
  }

  ngOnInit(): void {
    void this.carregar();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.revogarUrls(this.anexos());
  }

  abrirSeletor(): void {
    this.seletorArquivo()?.nativeElement.click();
  }

  recarregar(): void {
    void this.carregar();
  }

  async selecionarArquivo(evento: Event): Promise<void> {
    const seletor = evento.target as HTMLInputElement;
    const arquivo = seletor.files?.[0];
    seletor.value = '';

    if (!arquivo) {
      return;
    }

    if (!TIPOS_ANEXO_ACEITOS.includes(arquivo.type)) {
      this.erro.set('Selecione uma imagem JPEG, PNG ou WebP.');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ANEXO_BYTES) {
      this.erro.set('A imagem deve ter no máximo 5 MiB.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    try {
      const anexo = await this.anexosService.setEntidade({
        agendamentoId: this.agendamentoId(),
        arquivo,
      });

      if (this.destruido) {
        return;
      }

      this.anexos.update((anexos) => [
        ...anexos,
        { ...anexo, url: URL.createObjectURL(arquivo) },
      ]);
      this.quantidadeAlterada.emit(this.anexos().length);
    } catch (error) {
      this.tratarErro(error, 'Não foi possível enviar o anexo.');
    } finally {
      this.enviando.set(false);
    }
  }

  async remover(anexo: AnexoAgendamentoVisual): Promise<void> {
    this.removendoId.set(anexo.id);
    this.erro.set(null);

    try {
      await this.anexosService.deleteEntidade({
        agendamentoId: this.agendamentoId(),
        id: anexo.id,
      });
      URL.revokeObjectURL(anexo.url);
      this.anexos.update((anexos) =>
        anexos.filter((item) => item.id !== anexo.id),
      );
      this.quantidadeAlterada.emit(this.anexos().length);
    } catch (error) {
      this.tratarErro(error, 'Não foi possível remover o anexo.');
    } finally {
      this.removendoId.set(null);
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const resposta = await this.anexosService.getLista(this.agendamentoId());
      const anexos = await Promise.all(
        resposta.anexos.map(async (anexo) => {
          const conteudo = await this.anexosService.getConteudo({
            agendamentoId: this.agendamentoId(),
            id: anexo.id,
          });

          return { ...anexo, url: URL.createObjectURL(conteudo) };
        }),
      );

      if (this.destruido) {
        this.revogarUrls(anexos);
        return;
      }

      this.revogarUrls(this.anexos());
      this.anexos.set(anexos);
    } catch (error) {
      this.tratarErro(error, 'Não foi possível carregar os anexos.');
    } finally {
      this.carregando.set(false);
    }
  }

  private tratarErro(error: unknown, fallback: string): void {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    this.erro.set(
      error.status === 0
        ? 'Sem conexão. Tente novamente.'
        : error.message || fallback,
    );
  }

  private revogarUrls(anexos: AnexoAgendamentoVisual[]): void {
    anexos.forEach((anexo) => URL.revokeObjectURL(anexo.url));
  }
}
