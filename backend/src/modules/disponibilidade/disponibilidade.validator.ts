import type {
  AtualizarDisponibilidadeSemanalDto,
  AtualizarOverrideDisponibilidadeDto,
} from '@fluy/schema';
import { dataDisponibilidadeSchema } from '@fluy/schema';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class DisponibilidadeValidator {
  validarAtualizacaoSemanal(
    dados: AtualizarDisponibilidadeSemanalDto,
  ): AtualizarDisponibilidadeSemanalDto {
    this.validarSobreposicao({
      janelas: dados.janelas,
      porDia: true,
    });

    return dados;
  }

  validarAtualizacaoOverride(
    dados: AtualizarOverrideDisponibilidadeDto,
  ): AtualizarOverrideDisponibilidadeDto {
    if (dados.fechado) {
      if (dados.janelas) {
        throw new BadRequestException('Override fechado não pode ter janelas.');
      }

      return dados;
    }

    if (!dados.janelas || dados.janelas.length === 0) {
      throw new BadRequestException(
        'Informe ao menos uma janela para um override aberto.',
      );
    }

    this.validarSobreposicao({
      janelas: dados.janelas,
      porDia: false,
    });

    return dados;
  }

  validarData(data: string): string {
    const resultado = dataDisponibilidadeSchema.safeParse(data);

    if (!resultado.success) {
      throw new BadRequestException(
        'Informe uma data válida no formato YYYY-MM-DD.',
      );
    }

    return resultado.data;
  }

  private validarSobreposicao({
    janelas,
    porDia,
  }: {
    janelas: Array<{
      dia_semana?: number;
      hora_inicio: string;
      hora_fim: string;
    }>;
    porDia: boolean;
  }): void {
    const maiorHoraFimPorDia = new Map<number, string>();
    const janelasOrdenadas = [...janelas].sort((primeira, segunda) => {
      const diaPrimeira = porDia ? (primeira.dia_semana ?? 0) : 0;
      const diaSegunda = porDia ? (segunda.dia_semana ?? 0) : 0;

      return (
        diaPrimeira - diaSegunda ||
        primeira.hora_inicio.localeCompare(segunda.hora_inicio)
      );
    });

    for (const janela of janelasOrdenadas) {
      const diaSemana = porDia ? (janela.dia_semana ?? 0) : 0;
      const maiorHoraFim = maiorHoraFimPorDia.get(diaSemana);

      if (maiorHoraFim && janela.hora_inicio < maiorHoraFim) {
        throw new BadRequestException('Janelas não podem se sobrepor.');
      }

      if (!maiorHoraFim || janela.hora_fim > maiorHoraFim) {
        maiorHoraFimPorDia.set(diaSemana, janela.hora_fim);
      }
    }
  }
}
