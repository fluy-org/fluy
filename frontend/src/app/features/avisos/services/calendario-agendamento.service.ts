import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalendarioAgendamentoService {
  private readonly http = inject(HttpClient);

  async baixarPublico({
    subdominio,
    credencial,
    agendamentoId,
  }: {
    subdominio: string;
    credencial: string;
    agendamentoId: string;
  }): Promise<void> {
    const arquivo = await firstValueFrom(
      this.http.get(
        `/publico/s/${encodeURIComponent(subdominio)}/agendamentos/${encodeURIComponent(agendamentoId)}/calendario.ics`,
        {
          params: { credencial },
          responseType: 'blob',
        },
      ),
    );
    const endereco = URL.createObjectURL(arquivo);
    const link = document.createElement('a');

    link.href = endereco;
    link.download = `agendamento-${agendamentoId}.ics`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(endereco), 0);
  }
}
