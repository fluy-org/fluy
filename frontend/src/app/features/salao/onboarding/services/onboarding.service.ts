import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CriarSalaoDto, SalaoResponseDto } from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private http = inject(HttpClient);

  criar(dados: CriarSalaoDto): Promise<SalaoResponseDto> {
    return firstValueFrom(this.http.post<SalaoResponseDto>('/saloes', dados));
  }
}
