import { AUTH_ROUTES } from './auth.routes';

describe('AUTH_ROUTES', () => {
  it('redireciona o cadastro publico para o fluxo de convite', () => {
    const cadastro = AUTH_ROUTES.find((route) => route.path === 'cadastro');

    expect(cadastro?.redirectTo).toBe('convite');
    expect(cadastro?.pathMatch).toBe('full');
  });

  it('disponibiliza a pagina de convite', () => {
    const convite = AUTH_ROUTES.find((route) => route.path === 'convite');

    expect(convite?.loadComponent).toBeDefined();
  });
});
