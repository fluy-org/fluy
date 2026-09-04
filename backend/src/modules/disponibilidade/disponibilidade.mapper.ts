import type {
  DisponibilidadeSemanalResponseDto,
  ListaOverridesDisponibilidadeResponseDto,
  OverrideDisponibilidadeResponseDto,
  ProfissionalResponseDto,
} from '@fluy/schema';
import type {
  JanelaSemanalPersistida,
  OverrideDisponibilidadePersistido,
  ProfissionalResumoPersistido,
} from '@/modules/disponibilidade/contracts';

export function toProfissionalResponse(
  profissional: ProfissionalResumoPersistido,
): ProfissionalResponseDto {
  return {
    id: profissional.id,
    nome: profissional.nome,
    ativo: profissional.ativo,
  };
}

export function toDisponibilidadeSemanalResponse(
  janelas: JanelaSemanalPersistida[],
): DisponibilidadeSemanalResponseDto {
  return {
    janelas: [...janelas]
      .sort(compararJanelasSemanais)
      .map(({ dia_semana, hora_inicio, hora_fim }) => ({
        dia_semana,
        hora_inicio: formatarHora(hora_inicio),
        hora_fim: formatarHora(hora_fim),
      })),
  };
}

export function toOverrideDisponibilidadeResponse(
  override: OverrideDisponibilidadePersistido,
): OverrideDisponibilidadeResponseDto {
  return {
    data: override.data,
    fechado: override.fechado,
    janelas: [...override.janelas]
      .sort(compararJanelas)
      .map(({ hora_inicio, hora_fim }) => ({
        hora_inicio: formatarHora(hora_inicio),
        hora_fim: formatarHora(hora_fim),
      })),
  };
}

export function toOverridesResponse(
  overrides: OverrideDisponibilidadePersistido[],
): ListaOverridesDisponibilidadeResponseDto {
  return {
    overrides: [...overrides]
      .sort((primeiro, segundo) => primeiro.data.localeCompare(segundo.data))
      .map(toOverrideDisponibilidadeResponse),
  };
}

function compararJanelasSemanais(
  primeira: JanelaSemanalPersistida,
  segunda: JanelaSemanalPersistida,
): number {
  return (
    primeira.dia_semana - segunda.dia_semana ||
    compararJanelas(primeira, segunda)
  );
}

function compararJanelas(
  primeira: { hora_inicio: string },
  segunda: { hora_inicio: string },
): number {
  return primeira.hora_inicio.localeCompare(segunda.hora_inicio);
}

function formatarHora(hora: string): string {
  return hora.slice(0, 5);
}
