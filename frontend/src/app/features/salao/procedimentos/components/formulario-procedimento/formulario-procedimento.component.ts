import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  CriarProcedimentoDto,
  ProcedimentoResponseDto,
} from '@fluy/schema';
import { criarProcedimentoSchema } from '@fluy/schema';
import type { TipoSinal } from '@fluy/schema';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-formulario-procedimento',
  templateUrl: './formulario-procedimento.component.html',
  styleUrls: ['./formulario-procedimento.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class FormularioProcedimentoComponent implements OnDestroy {
  // Quando recebe um procedimento, o mesmo formulario passa a operar em edicao.
  readonly procedimento = input<ProcedimentoResponseDto | null>(null);
  readonly salvando = input(false);
  readonly erroExterno = input<string | null>(null);

  readonly salvar = output<CriarProcedimentoDto>();
  readonly cancelar = output<void>();
  readonly alterarImagem = output<File | null>();
  readonly solicitarRemocaoImagem = output<void>();
  readonly erroValidacao = signal<string | null>(null);
  readonly erroImagem = signal<string | null>(null);
  readonly arquivoImagem = signal<File | null>(null);
  readonly urlPreviewImagem = signal<string | null>(null);

  private urlTemporariaImagem: string | null = null;

  readonly titulo = computed(() =>
    this.procedimento() ? 'Editar procedimento' : 'Novo procedimento',
  );

  readonly formulario = new FormGroup(
    {
      nome: new FormControl('', { nonNullable: true }),
      descricao: new FormControl('', { nonNullable: true }),
      info_pre_procedimento: new FormControl('', { nonNullable: true }),
      duracao_min: new FormControl<number | null>(null),
      preco: new FormControl<number | null>(null),
      tipo_sinal: new FormControl<TipoSinal>('fixo', { nonNullable: true }),
      valor_sinal: new FormControl<number | null>(null),
      periodo_manutencao_dias: new FormControl<number | null>(null),
    },
    { updateOn: 'blur' },
  );

  constructor() {
    // Mantem o mesmo formulario preparado tanto para criacao quanto para edicao.
    effect(() => {
      const procedimento = this.procedimento();

      this.preencherFormulario(procedimento);
      this.limparSelecaoImagem(procedimento?.imagem_url ?? null);
    });
  }

  ngOnDestroy(): void {
    this.revogarUrlTemporaria();
  }

  selecionarImagem(evento: Event): void {
    const inputArquivo = evento.target as HTMLInputElement;
    const arquivo = inputArquivo.files?.[0];

    this.erroImagem.set(null);

    if (!arquivo) {
      return;
    }

    if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.type)) {
      this.erroImagem.set('Selecione uma imagem JPEG, PNG ou WebP.');
      inputArquivo.value = '';
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
      this.erroImagem.set('A imagem deve ter no maximo 5 MiB.');
      inputArquivo.value = '';
      return;
    }

    this.revogarUrlTemporaria();
    this.urlTemporariaImagem = URL.createObjectURL(arquivo);
    this.arquivoImagem.set(arquivo);
    this.urlPreviewImagem.set(this.urlTemporariaImagem);
    this.alterarImagem.emit(arquivo);
  }

  removerSelecaoImagem(inputArquivo: HTMLInputElement): void {
    inputArquivo.value = '';
    this.erroImagem.set(null);
    this.limparSelecaoImagem(this.procedimento()?.imagem_url ?? null);
    this.alterarImagem.emit(null);
  }

  removerImagemAtual(): void {
    this.urlPreviewImagem.set(null);
    this.solicitarRemocaoImagem.emit();
  }

  enviarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.erroValidacao.set(null);

    // O schema compartilhado garante que o frontend envie o contrato da API.
    const resultado = criarProcedimentoSchema.safeParse(this.dadosFormulario());

    if (!resultado.success) {
      this.erroValidacao.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    this.salvar.emit(resultado.data);
  }

  cancelarFormulario(): void {
    if (this.salvando()) {
      return;
    }

    this.erroValidacao.set(null);
    this.cancelar.emit();
  }

  private preencherFormulario(
    procedimento: ProcedimentoResponseDto | null,
  ): void {
    this.erroValidacao.set(null);
    this.formulario.reset(
      procedimento
        ? {
            nome: procedimento.nome,
            descricao: procedimento.descricao ?? '',
            info_pre_procedimento: procedimento.info_pre_procedimento ?? '',
            duracao_min: procedimento.duracao_min,
            preco: procedimento.preco,
            tipo_sinal: procedimento.tipo_sinal,
            valor_sinal: procedimento.valor_sinal,
            periodo_manutencao_dias: procedimento.periodo_manutencao_dias,
          }
        : {
            nome: '',
            descricao: '',
            info_pre_procedimento: '',
            duracao_min: null,
            preco: null,
            tipo_sinal: 'fixo',
            valor_sinal: null,
            periodo_manutencao_dias: null,
          },
    );
  }

  private limparSelecaoImagem(urlImagemAtual: string | null): void {
    this.revogarUrlTemporaria();
    this.arquivoImagem.set(null);
    this.urlPreviewImagem.set(urlImagemAtual);
    this.erroImagem.set(null);
  }

  private revogarUrlTemporaria(): void {
    if (!this.urlTemporariaImagem) {
      return;
    }

    URL.revokeObjectURL(this.urlTemporariaImagem);
    this.urlTemporariaImagem = null;
  }

  private dadosFormulario(): unknown {
    const dados = this.formulario.getRawValue();

    return {
      ...dados,
      // Campo vazio vira undefined porque a manutencao e opcional na API.
      periodo_manutencao_dias: dados.periodo_manutencao_dias ?? undefined,
    };
  }
}
