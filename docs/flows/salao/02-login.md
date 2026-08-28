# Salão — Login

## Objetivo

Autenticar a pessoa no Clerk para acessar sua conta global e, quando existir,
o painel do salão.

## Atualização de autenticação

Login por e-mail/senha e Google OAuth são executados pelo Clerk no frontend.
O backend aceita somente o Bearer token emitido pelo Clerk e não expõe
`POST /auth/login`. Após login normal, o frontend consulta `GET /usuarios/eu`;
uma resposta `404` indica cadastro local ainda não materializado e direciona
para a conclusão que chama `POST /usuarios`.

## Passo a passo

1. Pessoa acessa a URL de login do painel.
2. Frontend exibe os provedores habilitados no Clerk, como e-mail/senha e Google.
3. Clerk valida as credenciais e cria a sessão.
4. Frontend obtém o Bearer token da sessão e consulta `GET /usuarios/eu`.
5. Se a API responder `404`, direciona para a conclusão de cadastro, que chama
   `POST /usuarios` de forma idempotente.
6. Com a conta global materializada, a resposta `200` informa o estado:
   `sem-salao` direciona para o [onboarding](./01-onboarding.md) e
   `com-salao` direciona para o painel.

## Variações

- **Credencial inválida, rate limit, CAPTCHA ou recuperação de senha:** Clerk
  conduz o fluxo e o frontend apenas apresenta o estado retornado.
- **Conta local ausente:** a sessão continua válida; a pessoa apenas retorna à
  conclusão que materializa `usuario`.
- **Conta global sem salão:** a pessoa é direcionada ao onboarding, sem repetir
  cadastro ou autenticação.

## Regras de negócio

- **E-mail é único no `usuario` global.**
- A API só materializa a conta quando o Clerk retornar nome, sobrenome e e-mail
  primário verificado.
- O MVP habilita login por e-mail/senha e Google OAuth; 2FA fica desabilitado.
- Sessão, logout, recuperação de senha e regras de provedores pertencem ao Clerk.
- A autenticação não define salão ativo nem retorna dados de salão.

## Dependências

- **Clerk** para sessão e provedores de login.
- **Conta global Fluy** para materialização após a sessão.
- **Onboarding do salão** apenas quando não existir membership.

## Casos extremos (edge cases)

- **Pessoa autentica com uma identidade nova que usa e-mail de outro usuário:**
  `POST /usuarios` responde `409`; não há merge automático de contas no MVP.
- **Sessão expira durante ação crítica** (ex.: criando agendamento manual): sistema pede login novamente; idealmente preserva o estado da ação para retomar.
- **Login em múltiplos dispositivos simultaneamente:** permitido; cada dispositivo tem sua sessão.
- **Trocar de email:** fluxo de "alterar email" (com confirmação no email novo). Fora do escopo mínimo.

## Dúvidas em aberto

- **Duração da sessão e login por WhatsApp:** decisões de configuração/roadmap do Clerk.
