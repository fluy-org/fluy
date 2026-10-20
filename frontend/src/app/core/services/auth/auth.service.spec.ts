import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService - cadastro por convite', () => {
  let service: AuthService;
  let create: jasmine.Spy;
  let update: jasmine.Spy;
  let setActive: jasmine.Spy;
  let signUpResource: {
    emailAddress: string | null;
    create: jasmine.Spy;
    update: jasmine.Spy;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(AuthService);
    create = jasmine.createSpy('create').and.resolveTo({
      emailAddress: 'Convidada@Example.com',
    });
    update = jasmine.createSpy('update').and.resolveTo({
      emailAddress: 'convidada@example.com',
      status: 'complete',
      createdSessionId: 'sessao_123',
    });
    setActive = jasmine.createSpy('setActive').and.resolveTo();
    signUpResource = {
      emailAddress: 'convidada@example.com',
      create,
      update,
    };
    Object.defineProperty(service, 'clerk', {
      configurable: true,
      value: {
        client: { signUp: signUpResource },
        isSignedIn: true,
        setActive,
      },
    });
  });

  it('inicia o cadastro exclusivamente com a estrategia de ticket', async () => {
    await expectAsync(
      service.prepararCadastroPorConvite('ticket-secreto'),
    ).toBeResolvedTo({ email: 'Convidada@Example.com' });

    expect(create).toHaveBeenCalledOnceWith({
      strategy: 'ticket',
      ticket: 'ticket-secreto',
    });
  });

  it('conclui no recurso iniciado pelo ticket sem aceitar e-mail ou OAuth', async () => {
    await service.prepararCadastroPorConvite('ticket-secreto');
    await service.concluirCadastroPorConvite({
      nome: ' Ana ',
      sobrenome: ' Silva ',
      senha: 'senha-segura-123',
    });

    expect(update).toHaveBeenCalledOnceWith({
      firstName: 'Ana',
      lastName: 'Silva',
      password: 'senha-segura-123',
    });
    expect(setActive).toHaveBeenCalledOnceWith({ session: 'sessao_123' });
  });

  it('impede concluir quando a identidade atual difere do e-mail convidado', async () => {
    await service.prepararCadastroPorConvite('ticket-secreto');
    signUpResource.emailAddress = 'outra@example.com';

    await expectAsync(
      service.concluirCadastroPorConvite({
        nome: 'Outra',
        sobrenome: 'Pessoa',
        senha: 'senha-segura-123',
      }),
    ).toBeRejectedWithError(
      'A identidade do cadastro não corresponde ao e-mail convidado.',
    );
    expect(update).not.toHaveBeenCalled();
    expect(setActive).not.toHaveBeenCalled();
  });

  it('nao ativa sessao se o Clerk devolver outra identidade ao atualizar', async () => {
    await service.prepararCadastroPorConvite('ticket-secreto');
    update.and.resolveTo({
      emailAddress: 'outra@example.com',
      status: 'complete',
      createdSessionId: 'sessao_outra',
    });

    await expectAsync(
      service.concluirCadastroPorConvite({
        nome: 'Ana',
        sobrenome: 'Silva',
        senha: 'senha-segura-123',
      }),
    ).toBeRejected();
    expect(setActive).not.toHaveBeenCalled();
  });
});
