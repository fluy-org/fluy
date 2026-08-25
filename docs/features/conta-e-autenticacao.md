# Conta e Autenticação do Salão

## Objetivo

Permitir que uma pessoa crie e autentique sua conta global no Fluy antes de
criar ou acessar um salão. O onboarding do salão é um fluxo posterior,
independente da autenticação.

## Usuários envolvidos

- Pessoa que criará ou acessará um salão (usuário administrativo)

## Capacidades entregues

- Cadastrar e autenticar pelo Clerk com os provedores habilitados.
- Exigir e-mail primário verificado antes de criar a conta local.
- Materializar de forma idempotente o `usuario` global a partir do perfil Clerk.
- Consultar a conta global e o estado de membership para direcionar o login.
- Retomar a materialização da conta após interrupção do cadastro.
- Direcionar uma conta global sem membership para o onboarding do salão.

## Documentos de referência

- fluxos/salao/01-onboarding.md
- fluxos/salao/02-login.md

## Dependências

Depende de:
- Clerk configurado com e-mail/senha e Google OAuth, sem 2FA no MVP.
- Frontend capaz de obter e enviar o Bearer token da sessão Clerk.

Usado por:
- [[configuracao-do-salao]]
- [[gestao-disponibilidade]]
- [[gestao-procedimentos]]
- Todas as demais features do painel do salão (login é pré-requisito de acesso)

## Observações

- Cadastro, senha, Google OAuth, verificação de e-mail, recuperação de senha
  e sessão pertencem ao Clerk. Quando o Clerk conclui a sessão, o frontend
  chama `POST /usuarios` para materializar a conta global da Fluy.
- O cadastro é exibido pelo componente `SignUp` do Clerk em `/cadastro`; após
  uma sessão ativa, ele direciona para `/concluir-cadastro`.
- `GET /usuarios/eu` retorna `404` quando a conta local não existe. Para uma
  conta existente, retorna seus dados e `estado: sem-salao` ou `com-salao`;
  não seleciona nem retorna um salão ativo.
- `usuario_salao` é membership de um `usuario` em um `salao`; não representa
  conta, e-mail nem método de login.
- Modelagem já deve prever multi-usuário por salão (papéis, permissões), mas a UI de convite/gestão de funcionários está fora do MVP.
