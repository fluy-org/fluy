import { Injectable, NotFoundException } from '@nestjs/common';
import type { FusoHorarioBrasil } from '@fluy/schema';
import { SalaoRepository } from '@/modules/salao/salao.repository';

@Injectable()
export class SalaoConsultaService {
  constructor(private readonly salaoRepository: SalaoRepository) {}

  async obterFusoHorario(salaoId: string): Promise<FusoHorarioBrasil> {
    const salao = await this.buscarPorId(salaoId);

    return salao.fuso_horario;
  }

  async buscarPorId(salaoId: string) {
    const salao = await this.salaoRepository.buscarPorId(salaoId);

    if (!salao) {
      throw new NotFoundException('Salão não encontrado.');
    }

    return salao;
  }

  async buscarSetup(salaoId: string) {
    const setup = await this.salaoRepository.buscarSetup(salaoId);

    if (!setup) {
      throw new NotFoundException('Salão não encontrado.');
    }

    return setup;
  }
}
