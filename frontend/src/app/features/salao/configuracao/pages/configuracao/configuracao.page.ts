import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { ConfiguracaoSalaoResponseDto } from '@fluy/schema';
import { atualizarConfiguracaoSalaoSchema } from '@fluy/schema';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/angular/standalone';
import { ApiError } from '../../../../../core/errors/api-error';
import { HeaderComponent } from '../../../../../shared/components/header/header.component';
import { ConfiguracaoService } from '../../services/configuracao.service';

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
    IonInput,
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

  ngOnInit(): void {
    void this.carregarConfiguracao();
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
