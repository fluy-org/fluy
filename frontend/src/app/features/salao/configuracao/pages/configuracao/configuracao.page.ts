import { zodValidator } from '@app/shared/utils/zod-validator';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  ConfiguracaoSalaoResponseDto,
  SalaoResponseDto,
} from '@fluy/schema';
import {
  atualizarRecebimentoPixSchema,
  TIPO_CHAVE_PIX,
  atualizarConfiguracaoSalaoSchema,
} from '@fluy/schema';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copyOutline } from 'ionicons/icons';
import { ApiError } from '@app/core/errors/api-error';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { ConfiguracaoService } from '@app/features/salao/configuracao/services/configuracao.service';

@Component({
  selector: 'app-configuracao',
  templateUrl: './configuracao.page.html',
  styleUrls: ['./configuracao.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonTextarea,
    ReactiveFormsModule,
  ],
})
export class ConfiguracaoPage implements OnInit {
  private configuracaoService = inject(ConfiguracaoService);

  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erroCarregamento = signal<string | null>(null);
  readonly erroFormulario = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);
  readonly salao = signal<SalaoResponseDto | null>(null);
  readonly carregandoLinkPublico = signal(true);
  readonly copiandoLinkPublico = signal(false);
  readonly mensagemLinkPublico = signal<string | null>(null);
  readonly erroLinkPublico = signal<string | null>(null);
  readonly linkPublico = computed(() => {
    const subdominio = this.salao()?.subdominio;

    if (!subdominio) {
      return '';
    }

    return new URL(
      `/s/${encodeURIComponent(subdominio)}`,
      window.location.origin,
    ).toString();
  });

  readonly formulario = new FormGroup(
    {
      granularidade_min: new FormControl<number | null>(null),
      prazo_reserva_min: new FormControl<number | null>(null),
      tolerancia_atraso_min: new FormControl<number | null>(null),
      antecedencia_min_horas: new FormControl<number | null>(null),
      antecedencia_max_dias: new FormControl<number | null>(null),
      mensagem_confirmacao: new FormControl('', { nonNullable: true }),
      politica_atraso: new FormControl('', { nonNullable: true }),
    },
    // Evita validar campos numericos enquanto o usuario ainda esta digitando.
    { updateOn: 'blur' },
  );

  readonly tiposChave = TIPO_CHAVE_PIX;
  readonly carregandoRecebimento = signal(true);
  readonly salvandoRecebimento = signal(false);
  readonly erroRecebimento = signal<string | null>(null);
  readonly sucessoRecebimento = signal<string | null>(null);
  readonly recebimentoCarregado = signal(false);
  readonly formularioRecebimento = new FormGroup(
    {
      tipo_chave: new FormControl<(typeof TIPO_CHAVE_PIX)[number]>('email', {
        nonNullable: true,
        validators: zodValidator(
          atualizarRecebimentoPixSchema.shape.tipo_chave,
        ),
      }),
      chave: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(atualizarRecebimentoPixSchema.shape.chave),
      }),
      nome_recebedor: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(
          atualizarRecebimentoPixSchema.shape.nome_recebedor,
        ),
      }),
    },
    { validators: zodValidator(atualizarRecebimentoPixSchema) },
  );

  constructor() {
    addIcons({ copyOutline });
  }

  ngOnInit(): void {
    void this.carregarRecebimento();
    void this.carregarConfiguracao();
    void this.carregarLinkPublico();
  }

  async carregarRecebimento(): Promise<void> {
    this.carregandoRecebimento.set(true);
    this.erroRecebimento.set(null);
    this.recebimentoCarregado.set(false);
    try {
      const dados = await this.configuracaoService.getRecebimento();
      this.formularioRecebimento.reset(dados);
      this.recebimentoCarregado.set(true);
    } catch (erro) {
      if (!(erro instanceof ApiError)) throw erro;
      if (erro.status === 404) this.recebimentoCarregado.set(true);
      else this.erroRecebimento.set(erro.message);
    } finally {
      this.carregandoRecebimento.set(false);
    }
  }

  async salvarRecebimento(): Promise<void> {
    if (this.salvandoRecebimento() || !this.recebimentoCarregado()) return;
    this.sucessoRecebimento.set(null);
    this.erroRecebimento.set(null);
    this.formularioRecebimento.markAllAsTouched();
    const resultado = atualizarRecebimentoPixSchema.safeParse(
      this.formularioRecebimento.getRawValue(),
    );
    if (!resultado.success) {
      this.erroRecebimento.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados.',
      );
      return;
    }
    this.salvandoRecebimento.set(true);
    try {
      const atualizado = await this.configuracaoService.updateRecebimento(
        resultado.data,
      );
      this.formularioRecebimento.reset(atualizado);
      this.sucessoRecebimento.set('Dados de recebimento salvos.');
    } catch (erro) {
      if (!(erro instanceof ApiError)) throw erro;
      this.erroRecebimento.set(erro.message);
    } finally {
      this.salvandoRecebimento.set(false);
    }
  }

  async copiarLinkPublico(): Promise<void> {
    const link = this.linkPublico();

    if (!link || this.copiandoLinkPublico()) {
      return;
    }

    this.copiandoLinkPublico.set(true);
    this.mensagemLinkPublico.set(null);
    this.erroLinkPublico.set(null);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API indisponível.');
      }

      await navigator.clipboard.writeText(link);
      this.mensagemLinkPublico.set(
        'Link copiado! Agora é só enviar para suas clientes.',
      );
    } catch {
      this.erroLinkPublico.set(
        'Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.',
      );
    } finally {
      this.copiandoLinkPublico.set(false);
    }
  }

  async salvarConfiguracao(): Promise<void> {
    if (this.salvando() || this.carregando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroFormulario.set(null);
    this.mensagemSucesso.set(null);

    // O mesmo schema usado pela API valida o objeto completo antes do PUT.
    const resultado = atualizarConfiguracaoSalaoSchema.safeParse(
      this.dadosFormulario(),
    );

    if (!resultado.success) {
      this.erroFormulario.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    // Esta regra depende da combinacao de dois campos e complementa o schema.
    if (
      resultado.data.antecedencia_min_horas! >
      resultado.data.antecedencia_max_dias! * 24
    ) {
      this.erroFormulario.set(
        'A antecedência mínima não pode ser maior que a antecedência máxima.',
      );
      return;
    }

    this.salvando.set(true);

    try {
      const configuracaoAtualizada =
        await this.configuracaoService.updateEntidade(resultado.data);

      this.preencherFormulario(configuracaoAtualizada);
      this.mensagemSucesso.set('Configurações salvas com sucesso.');
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroFormulario.set(error.message);
    } finally {
      this.salvando.set(false);
    }
  }

  private async carregarConfiguracao(): Promise<void> {
    this.carregando.set(true);
    this.erroCarregamento.set(null);

    try {
      const configuracao = await this.configuracaoService.getEntidade();
      this.preencherFormulario(configuracao);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroCarregamento.set(error.message);
    } finally {
      this.carregando.set(false);
    }
  }

  private async carregarLinkPublico(): Promise<void> {
    this.carregandoLinkPublico.set(true);
    this.erroLinkPublico.set(null);

    try {
      this.salao.set(await this.configuracaoService.getSalaoAtual());
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      this.erroLinkPublico.set(error.message);
    } finally {
      this.carregandoLinkPublico.set(false);
    }
  }

  private preencherFormulario(
    configuracao: ConfiguracaoSalaoResponseDto,
  ): void {
    // Campos opcionais chegam como null da API, mas o textarea trabalha com string.
    this.formulario.reset({
      ...configuracao,
      mensagem_confirmacao: configuracao.mensagem_confirmacao ?? '',
      politica_atraso: configuracao.politica_atraso ?? '',
    });
    this.formulario.markAsPristine();
  }

  private dadosFormulario(): unknown {
    const dados = this.formulario.getRawValue();

    return {
      ...dados,
      // Textos vazios viram null para representar ausencia no contrato HTTP.
      mensagem_confirmacao: dados.mensagem_confirmacao.trim() || null,
      politica_atraso: dados.politica_atraso.trim() || null,
    };
  }
}
