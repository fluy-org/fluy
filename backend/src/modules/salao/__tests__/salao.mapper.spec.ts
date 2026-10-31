import { toSalaoPublicoResponse } from '@/modules/salao/salao.mapper';
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
