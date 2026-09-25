import {
  adicionarDiasNaData,
  adicionarDiasNoInstante,
  dataHoraCivilParaUtc,
  utcParaDataHoraCivil,
} from '@/shared/horario-salao/horario-salao.utils';

const FUSO_SAO_PAULO = 'America/Sao_Paulo';

describe('horario-salao.utils', () => {
  describe('adicionarDiasNaData', () => {
    it('avanca um dia dentro do mesmo mes', () => {
      expect(adicionarDiasNaData({ data: '2026-09-15', dias: 1 })).toBe(
        '2026-09-16',
      );
    });

    it('avanca na virada de mes', () => {
      expect(adicionarDiasNaData({ data: '2026-09-30', dias: 1 })).toBe(
        '2026-10-01',
      );
    });

    it('avanca na virada de ano', () => {
      expect(adicionarDiasNaData({ data: '2026-12-31', dias: 1 })).toBe(
        '2027-01-01',
      );
    });

    it('avanca no ultimo dia de fevereiro de ano bissexto', () => {
      expect(adicionarDiasNaData({ data: '2028-02-28', dias: 1 })).toBe(
        '2028-02-29',
      );
    });

    it('retrocede com dias negativos', () => {
      expect(adicionarDiasNaData({ data: '2026-01-01', dias: -1 })).toBe(
        '2025-12-31',
      );
    });

    it('mantem a data quando nao avanca nenhum dia', () => {
      expect(adicionarDiasNaData({ data: '2026-09-15', dias: 0 })).toBe(
        '2026-09-15',
      );
    });
  });

  describe('faixa do dia no fuso do salao', () => {
    it('cobre exatamente vinte e quatro horas', () => {
      const data = '2026-09-15';
      const inicioDia = dataHoraCivilParaUtc({
        data,
        hora: '00:00',
        fusoHorario: FUSO_SAO_PAULO,
      });
      const fimDia = dataHoraCivilParaUtc({
        data: adicionarDiasNaData({ data, dias: 1 }),
        hora: '00:00',
        fusoHorario: FUSO_SAO_PAULO,
      });

      expect(fimDia.getTime() - inicioDia.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('inclui o ultimo minuto do dia civil do salao', () => {
      const data = '2026-09-15';
      const fimDia = dataHoraCivilParaUtc({
        data: adicionarDiasNaData({ data, dias: 1 }),
        hora: '00:00',
        fusoHorario: FUSO_SAO_PAULO,
      });
      const ultimoMinuto = dataHoraCivilParaUtc({
        data,
        hora: '23:59',
        fusoHorario: FUSO_SAO_PAULO,
      });

      expect(ultimoMinuto.getTime()).toBeLessThan(fimDia.getTime());
    });
  });

  describe('conversao entre instante e hora civil', () => {
    it('converte a hora civil do salao para o instante UTC correspondente', () => {
      const instante = dataHoraCivilParaUtc({
        data: '2026-09-15',
        hora: '10:00',
        fusoHorario: FUSO_SAO_PAULO,
      });

      expect(instante.toISOString()).toBe('2026-09-15T13:00:00.000Z');
    });

    it('volta do instante UTC para a mesma hora civil', () => {
      const dataHora = { data: '2026-09-15', hora: '10:00' };
      const instante = dataHoraCivilParaUtc({
        ...dataHora,
        fusoHorario: FUSO_SAO_PAULO,
      });

      expect(
        utcParaDataHoraCivil({
          dataHora: instante,
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual(dataHora);
    });

    it('resolve a data civil do salao quando o instante ja virou o dia em UTC', () => {
      const instante = new Date('2026-09-16T02:00:00.000Z');

      expect(
        utcParaDataHoraCivil({
          dataHora: instante,
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toEqual({ data: '2026-09-15', hora: '23:00' });
    });

    it('recusa data ou horario civil invalidos', () => {
      expect(() =>
        dataHoraCivilParaUtc({
          data: '2026-02-30',
          hora: '10:00',
          fusoHorario: FUSO_SAO_PAULO,
        }),
      ).toThrow('Data ou horário civil inválidos.');
    });
  });

  describe('adicionarDiasNoInstante', () => {
    it('recua trinta dias em UTC sem depender do fuso', () => {
      expect(
        adicionarDiasNoInstante({
          instante: new Date('2026-09-24T02:30:00.000Z'),
          dias: -30,
        }).toISOString(),
      ).toBe('2026-08-25T02:30:00.000Z');
    });
  });
});
