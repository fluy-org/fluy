import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ConfiguracaoService } from './configuracao.service';

describe('Configuração de recebimento Pix', () => {
  const dados = {
    tipo_chave: 'email' as const,
    chave: 'salao@example.com',
    nome_recebedor: 'Salão',
  };
  const resposta = { ...dados, atualizado_em: '2030-01-01T00:00:00.000Z' };
  let http: jasmine.SpyObj<HttpClient>;
  let service: ConfiguracaoService;
  beforeEach(() => {
    http = jasmine.createSpyObj('HttpClient', ['get', 'put']);
    service = runInInjectionContext(
      Injector.create({ providers: [{ provide: HttpClient, useValue: http }] }),
      () => new ConfiguracaoService(),
    );
  });
  it('consulta e reabre dados do recebimento', async () => {
    http.get.and.returnValue(of(resposta));
    expect(await service.getRecebimento()).toEqual(resposta);
    expect(http.get).toHaveBeenCalledWith(
      '/salao/configuracao/recebimento-pix',
    );
    expect(service.recebimento()).toEqual(resposta);
  });
  it('salva com retorno canônico sem novo GET', async () => {
    http.put.and.returnValue(of(resposta));
    await service.updateRecebimento(dados);
    expect(http.put).toHaveBeenCalledWith(
      '/salao/configuracao/recebimento-pix',
      dados,
    );
    expect(service.recebimento()).toEqual(resposta);
    expect(http.get).not.toHaveBeenCalled();
  });
  it('erro de salvamento preserva estado anterior e não simula sucesso', async () => {
    http.get.and.returnValue(of(resposta));
    await service.getRecebimento();
    http.put.and.returnValue(throwError(() => new Error('Indisponível')));
    await expectAsync(
      service.updateRecebimento({ ...dados, chave: 'outra@example.com' }),
    ).toBeRejected();
    expect(service.recebimento()).toEqual(resposta);
  });
});
