import type { SalaoConsultado } from '@/modules/salao/contracts';
import {
  toSalaoAtualResponse,
  toSalaoPublicoResponse,
} from '@/modules/salao/salao.mapper';

describe('salao.mapper', () => {
  describe('toSalaoAtualResponse', () => {
    it('mapeia o salao autenticado e serializa a data em ISO', () => {
      const salao = {
        id: '00000000-0000-4000-8000-000000000001',
        nome: 'Salão da Ana',
        subdominio: 'salao-da-ana',
        contato_whatsapp: '5511999999999',
        endereco: 'Rua das Flores, 1',
        fuso_horario: 'America/Sao_Paulo',
        criado_em: new Date('2026-10-22T12:30:00.000Z'),
      } satisfies SalaoConsultado;

      expect(toSalaoAtualResponse(salao)).toEqual({
        ...salao,
        criado_em: '2026-10-22T12:30:00.000Z',
      });
    });
  });

  describe('toSalaoPublicoResponse', () => {
    it('expõe o fuso do salão para apresentar os instantes do checkout', () => {
      expect(
        toSalaoPublicoResponse(
          {
            nome: 'Salão',
            subdominio: 'salao',
            contato_whatsapp: '+5511999999999',
            endereco: 'Rua A',
            fuso_horario: 'America/Manaus',
          } as never,
          {
            mensagem_confirmacao: null,
            politica_atraso: null,
            tolerancia_atraso_min: 15,
          } as never,
        ),
      ).toHaveProperty('fuso_horario', 'America/Manaus');
    });
  });
});
