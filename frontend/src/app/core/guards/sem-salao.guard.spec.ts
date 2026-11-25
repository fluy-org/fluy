import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { semSalaoGuard } from './sem-salao.guard';
import { ContaService } from '@app/features/auth/services/conta.service';
import { ApiError } from '@app/core/errors/api-error';

describe('semSalaoGuard', () => {
  let contaServiceMock: { consultarAtual: jest.Mock };
  let routerMock: { createUrlTree: jest.Mock };

  beforeEach(() => {
    contaServiceMock = {
      consultarAtual: jest.fn(),
    };
    routerMock = {
      createUrlTree: jest.fn((commands: string[]) => ({
        toString: () => commands.join('/'),
      } as unknown as UrlTree)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ContaService, useValue: contaServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('permite acesso ao onboarding quando usuario nao possui salao', async () => {
    contaServiceMock.consultarAtual.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      estado: 'sem-salao',
    });

    const resultado = await TestBed.runInInjectionContext(() =>
      semSalaoGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('redireciona para /painel/agenda quando usuario ja possui salao', async () => {
    contaServiceMock.consultarAtual.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      estado: 'com-salao',
    });

    const resultado = await TestBed.runInInjectionContext(() =>
      semSalaoGuard({} as never, {} as never),
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/painel/agenda']);
    expect(resultado).toEqual(expect.objectContaining({ toString: expect.any(Function) }));
  });

  it('redireciona para /concluir-cadastro quando conta nao foi materializada (404)', async () => {
    contaServiceMock.consultarAtual.mockRejectedValue(
      new ApiError(404, 'Nao encontrado'),
    );

    const resultado = await TestBed.runInInjectionContext(() =>
      semSalaoGuard({} as never, {} as never),
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/concluir-cadastro']);
  });
});
