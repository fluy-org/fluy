import { Injectable, NotFoundException } from '@nestjs/common';
import { SalaoRepository } from '@/modules/salao/salao.repository';

@Injectable()
export class SalaoConsultaService {
  constructor(private readonly salaoRepository: SalaoRepository) {}

  async obterFusoHorario(salaoId: string): Promise<string> {
    const salao = await this.salaoRepository.buscarPorId(salaoId);

    if (!salao) {
      throw new NotFoundException('Salão não encontrado.');
    }

    return salao.fuso_horario;
  }
}
