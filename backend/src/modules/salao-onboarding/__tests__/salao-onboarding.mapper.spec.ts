import type { SalaoPersistido } from '@/modules/salao-onboarding/contracts';
import { toSalaoResponse } from '@/modules/salao-onboarding/salao-onboarding.mapper';

describe('toSalaoResponse', () => {
  it('mapeia todos os campos persistidos e serializa a data em ISO', () => {
    const salao = {
      id: 'salao-ana',
      nome: 'Salao da Ana',
      subdominio: 'salao-da-ana',
      contato_whatsapp: '5511999999999',
      endereco: 'Rua das Flores, 1',
      fuso_horario: 'America/Sao_Paulo',
      criado_em: new Date('2026-01-01T12:30:00.000Z'),
    } as SalaoPersistido;

    expect(toSalaoResponse(salao)).toEqual({
      ...salao,
      criado_em: '2026-01-01T12:30:00.000Z',
    });
  });
});
