import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnChanges,
  OnDestroy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { AvisoResponseDto } from '@fluy/schema';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  checkmarkOutline,
  closeOutline,
  notificationsOutline,
  openOutline,
} from 'ionicons/icons';
import { AvisosService } from '@app/features/avisos/services/avisos.service';
import { CalendarioAgendamentoService } from '@app/features/avisos/services/calendario-agendamento.service';

export type EscopoCentralAvisos = 'salao' | 'cliente';
export type ModoCentralAvisos = 'flutuante' | 'cabecalho' | 'bloco';

@Component({
  selector: 'app-central-avisos',
  standalone: true,
  imports: [IonBadge, IonButton, IonIcon, IonSpinner, IonText],
  templateUrl: './central-avisos.component.html',
  styleUrls: ['./central-avisos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.central-flutuante]': "modo() === 'flutuante'",
    '[class.central-cabecalho]': "modo() === 'cabecalho'",
    '[class.central-bloco]': "modo() === 'bloco'",
  },
})
export class CentralAvisosComponent implements OnChanges, OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly avisosService = inject(AvisosService);
  private readonly calendarioService = inject(CalendarioAgendamentoService);

  readonly escopo = input.required<EscopoCentralAvisos>();
  readonly modo = input<ModoCentralAvisos>('bloco');
  readonly subdominio = input<string | null>(null);
  readonly credencial = input<string | null>(null);
  readonly selecionarAgendamento = output<string>();

  readonly aberto = signal(false);
  readonly carregando = signal(false);
  readonly carregandoMais = signal(false);
  readonly reconhecendoId = signal<string | null>(null);
  readonly baixandoCalendarioId = signal<string | null>(null);
  readonly erro = signal<string | null>(null);
  readonly erroCalendario = signal<string | null>(null);
  readonly avisos = signal<AvisoResponseDto[]>([]);
  readonly proximoCursor = signal<string | null>(null);

  private chaveCarregada: string | null = null;
  private pollingId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({
      calendarOutline,
      checkmarkOutline,
      closeOutline,
      notificationsOutline,
      openOutline,
    });
  }

  ngOnChanges(): void {
    const chave = this.obterChaveAtual();

    if (!chave) {
      this.pararPolling();
      return;
    }

    this.iniciarPolling();

    if (chave === this.chaveCarregada) return;

    this.chaveCarregada = chave;
    this.avisos.set([]);
    this.proximoCursor.set(null);
    void this.carregar();
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  abrir(): void {
    this.aberto.set(true);
    void this.atualizarEmSegundoPlano();
  }

  fechar(): void {
    this.aberto.set(false);
  }

  @HostListener('document:click', ['$event.target'])
  fecharAoClicarFora(alvo: EventTarget | null): void {
    if (
      this.aberto() &&
      alvo instanceof Node &&
      !this.elemento.nativeElement.contains(alvo)
    ) {
      this.fechar();
    }
  }

  async carregar(cursor?: string, silencioso = false): Promise<void> {
    if (!this.podeConsultar()) return;

    if (cursor) {
      this.carregandoMais.set(true);
    } else if (!silencioso) {
      this.carregando.set(true);
    }
    this.erro.set(null);

    try {
      const resposta = await this.buscarAvisos(cursor);

      this.avisos.update((atuais) =>
        cursor
          ? this.mesclarSemDuplicar(atuais, resposta.itens)
          : resposta.itens,
      );
      this.proximoCursor.set(resposta.proximo_cursor);
    } catch {
      if (!silencioso) {
        this.erro.set('Não foi possível carregar os avisos.');
      }
    } finally {
      this.carregando.set(false);
      this.carregandoMais.set(false);
    }
  }

  async reconhecer(aviso: AvisoResponseDto): Promise<void> {
    if (!this.podeConsultar() || this.reconhecendoId()) return;

    this.reconhecendoId.set(aviso.id);
    this.erro.set(null);

    try {
      if (this.escopo() === 'salao') {
        await this.avisosService.reconhecerSalao(aviso.id);
      } else {
        await this.avisosService.reconhecerCliente(
          this.subdominio()!,
          this.credencial()!,
          aviso.id,
        );
      }

      await this.carregar();
    } catch {
      this.erro.set('Não foi possível reconhecer o aviso.');
    } finally {
      this.reconhecendoId.set(null);
    }
  }

  async baixarCalendario(aviso: AvisoResponseDto): Promise<void> {
    if (
      this.escopo() !== 'cliente' ||
      !aviso.agendamento_id ||
      !this.podeConsultar() ||
      this.baixandoCalendarioId()
    ) {
      return;
    }

    this.baixandoCalendarioId.set(aviso.id);
    this.erroCalendario.set(null);

    try {
      await this.calendarioService.baixarPublico({
        subdominio: this.subdominio()!,
        credencial: this.credencial()!,
        agendamentoId: aviso.agendamento_id,
      });
    } catch {
      this.erroCalendario.set(
        'Não foi possível baixar o evento de calendário.',
      );
    } finally {
      this.baixandoCalendarioId.set(null);
    }
  }

  textoAcaoCalendario(aviso: AvisoResponseDto): string | null {
    switch (aviso.tipo) {
      case 'agendamento_criado':
        return 'Adicionar ao calendário';
      case 'agendamento_remarcado':
        return 'Atualizar calendário';
      case 'agendamento_cancelado':
        return 'Remover do calendário';
      default:
        return null;
    }
  }

  formatarData(data: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data));
  }

  private buscarAvisos(cursor?: string) {
    if (this.escopo() === 'salao') {
      return this.avisosService.listarSalao(cursor);
    }

    return this.avisosService.listarCliente(
      this.subdominio()!,
      this.credencial()!,
      cursor,
    );
  }

  private podeConsultar(): boolean {
    return (
      this.escopo() === 'salao' ||
      Boolean(this.subdominio() && this.credencial())
    );
  }

  private obterChaveAtual(): string | null {
    if (this.escopo() === 'salao') return 'salao';

    const subdominio = this.subdominio();
    const credencial = this.credencial();
    return subdominio && credencial ? `${subdominio}:${credencial}` : null;
  }

  private mesclarSemDuplicar(
    atuais: AvisoResponseDto[],
    novos: AvisoResponseDto[],
  ): AvisoResponseDto[] {
    const ids = new Set(atuais.map((aviso) => aviso.id));
    return [...atuais, ...novos.filter((aviso) => !ids.has(aviso.id))];
  }

  private iniciarPolling(): void {
    if (this.pollingId !== null) return;

    this.pollingId = setInterval(() => {
      void this.atualizarEmSegundoPlano();
    }, 15_000);
  }

  private pararPolling(): void {
    if (this.pollingId === null) return;

    clearInterval(this.pollingId);
    this.pollingId = null;
  }

  private async atualizarEmSegundoPlano(): Promise<void> {
    if (
      document.hidden ||
      this.carregando() ||
      this.carregandoMais() ||
      !this.podeConsultar()
    ) {
      return;
    }

    await this.carregar(undefined, true);
  }
}
