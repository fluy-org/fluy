import { Pipe, PipeTransform } from '@angular/core';

export type FormatoHoraSalao = 'hora' | 'data-hora';

@Pipe({
  name: 'horaSalao',
  standalone: true,
})
export class HoraSalaoPipe implements PipeTransform {
  transform(
    instante: string | null | undefined,
    fusoHorario: string,
    formato: FormatoHoraSalao = 'hora',
  ): string {
    if (!instante) {
      return '';
    }

    const dataHora = new Date(instante);

    if (Number.isNaN(dataHora.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: fusoHorario,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      ...(formato === 'data-hora'
        ? { day: '2-digit', month: '2-digit', year: 'numeric' }
        : {}),
    }).format(dataHora);
  }
}
