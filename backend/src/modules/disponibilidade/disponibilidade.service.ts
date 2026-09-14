import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AtualizarDisponibilidadeSemanalInput,
  AtualizarOverrideDisponibilidadeInput,
  BuscarProfissionalInput,
  ListarProfissionaisComJanelasNoDiaInput,
  ListarOverridesDisponibilidadeInput,
  ProfissionalComJanelasNoDia,
  RemoverOverrideDisponibilidadeInput,
} from '@/modules/disponibilidade/contracts';
import { DisponibilidadeRepository } from '@/modules/disponibilidade/disponibilidade.repository';
import { DisponibilidadeValidator } from '@/modules/disponibilidade/disponibilidade.validator';

@Injectable()
export class DisponibilidadeService {
  constructor(
    private readonly disponibilidadeRepository: DisponibilidadeRepository,
    private readonly disponibilidadeValidator: DisponibilidadeValidator,
  ) {}

  listarProfissionais(salaoId: string) {
    return this.disponibilidadeRepository.listarProfissionais(salaoId);
  }

  async listarProfissionaisComJanelasNoDia(
    input: ListarProfissionaisComJanelasNoDiaInput,
  ): Promise<ProfissionalComJanelasNoDia[]> {
    const profissionais =
      await this.disponibilidadeRepository.listarProfissionaisAtivos(
        input.salaoId,
      );

    if (profissionais.length === 0) {
      return [];
    }

    const profissionalIds = profissionais.map(
      (profissional) => profissional.id,
    );
    const [janelasSemanais, overrides] = await Promise.all([
      this.disponibilidadeRepository.listarJanelasSemanaisDoDia({
        profissionalIds,
        diaSemana: this.obterDiaDaSemana(input.data),
      }),
      this.disponibilidadeRepository.listarOverridesDoDia({
        profissionalIds,
        data: input.data,
      }),
    ]);
    const janelasSemanaisPorProfissional =
      this.agruparJanelasPorProfissional(janelasSemanais);
    const overridesPorProfissional =
      this.agruparOverridesPorProfissional(overrides);

    return profissionais.map((profissional) => {
      const override = overridesPorProfissional.get(profissional.id);

      return {
        id: profissional.id,
        janelas: override
          ? override.fechado
            ? []
            : override.janelas
          : (janelasSemanaisPorProfissional.get(profissional.id) ?? []),
      };
    });
  }

  async buscarJanelasSemanais(input: BuscarProfissionalInput) {
    await this.buscarProfissionalDoSalao(input);

    return this.disponibilidadeRepository.listarJanelasSemanais(
      input.profissionalId,
    );
  }

  async atualizarJanelasSemanais(input: AtualizarDisponibilidadeSemanalInput) {
    await this.buscarProfissionalDoSalao(input);

    const dados = this.disponibilidadeValidator.validarAtualizacaoSemanal(
      input.dados,
    );

    return this.disponibilidadeRepository.substituirJanelasSemanais({
      ...input,
      dados,
    });
  }

  async listarOverrides(input: ListarOverridesDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    return this.disponibilidadeRepository.listarOverrides(input);
  }

  async atualizarOverride(input: AtualizarOverrideDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    const dados = this.disponibilidadeValidator.validarAtualizacaoOverride(
      input.dados,
    );
    const data = this.disponibilidadeValidator.validarData(input.data);

    return this.disponibilidadeRepository.substituirOverride({
      ...input,
      dados,
      data,
    });
  }

  async removerOverride(input: RemoverOverrideDisponibilidadeInput) {
    await this.buscarProfissionalDoSalao(input);

    await this.disponibilidadeRepository.removerOverride({
      ...input,
      data: this.disponibilidadeValidator.validarData(input.data),
    });
  }

  private async buscarProfissionalDoSalao(input: BuscarProfissionalInput) {
    const profissional =
      await this.disponibilidadeRepository.buscarProfissional(input);

    if (!profissional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return profissional;
  }

  private obterDiaDaSemana(data: string): number {
    return new Date(`${data}T00:00:00.000Z`).getUTCDay();
  }

  private agruparJanelasPorProfissional(
    janelas: Array<{
      profissional_id: string;
      hora_inicio: string;
      hora_fim: string;
    }>,
  ): Map<string, ProfissionalComJanelasNoDia['janelas']> {
    const janelasPorProfissional = new Map<
      string,
      ProfissionalComJanelasNoDia['janelas']
    >();

    for (const janela of janelas) {
      const janelasDoProfissional =
        janelasPorProfissional.get(janela.profissional_id) ?? [];
      janelasDoProfissional.push({
        hora_inicio: janela.hora_inicio,
        hora_fim: janela.hora_fim,
      });
      janelasPorProfissional.set(janela.profissional_id, janelasDoProfissional);
    }

    return janelasPorProfissional;
  }

  private agruparOverridesPorProfissional(
    overrides: Array<{
      profissional_id: string;
      fechado: boolean;
      hora_inicio: string | null;
      hora_fim: string | null;
    }>,
  ): Map<
    string,
    {
      fechado: boolean;
      janelas: ProfissionalComJanelasNoDia['janelas'];
    }
  > {
    const overridesPorProfissional = new Map<
      string,
      {
        fechado: boolean;
        janelas: ProfissionalComJanelasNoDia['janelas'];
      }
    >();

    for (const override of overrides) {
      const overrideDoProfissional = overridesPorProfissional.get(
        override.profissional_id,
      ) ?? {
        fechado: override.fechado,
        janelas: [],
      };

      if (override.hora_inicio && override.hora_fim) {
        overrideDoProfissional.janelas.push({
          hora_inicio: override.hora_inicio,
          hora_fim: override.hora_fim,
        });
      }

      overridesPorProfissional.set(
        override.profissional_id,
        overrideDoProfissional,
      );
    }

    return overridesPorProfissional;
  }
}
