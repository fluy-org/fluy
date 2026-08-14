# Conta e Autenticação do Salão

## Objetivo

Permitir que o dono do salão crie sua conta no Fluy, complete o setup mínimo para começar a operar (dados do salão, subdomínio público, primeiro procedimento, primeira janela de disponibilidade) e faça login posterior no painel administrativo com segurança.

## Usuários envolvidos

- Dono do salão (usuário administrativo)

## Capacidades entregues

- Cadastrar nova conta com email + senha OU via Google OAuth.
- Provisionar o "salão-vazio" associado à conta durante o onboarding.
- Guiar o dono através do setup mínimo obrigatório (dados do salão, subdomínio, primeiro procedimento, primeira janela de disponibilidade) antes de habilitar recebimento de agendamentos.
- Validar e reservar subdomínio único no Fluy (`nome-do-salao.fluy.app`).
- Autenticar usuário existente por email + senha OU Google OAuth.
- Manter sessão persistente do usuário no painel.
- Oferecer logout explícito.
- Oferecer recuperação de senha via email.
- Associar múltiplos métodos de login (senha + Google) à mesma conta pelo email.
- Suportar retomada de setup incompleto quando dono abandona no meio.
- Suportar proteção contra brute force em tentativas de login.

## Documentos de referência

- fluxos/salao/01-onboarding.md
- fluxos/salao/02-login.md

## Dependências

Depende de:
- Provisionamento de subdomínio wildcard SSL (infraestrutura)
- Provedor de email transacional (recuperação de senha)
- Google Cloud Console (credenciais OAuth)

Usado por:
- [[configuracao-do-salao]]
- [[gestao-disponibilidade]]
- [[gestao-procedimentos]]
- Todas as demais features do painel do salão (login é pré-requisito de acesso)

## Observações

- Cadastro, senha, Google OAuth, verificação de e-mail e sessão pertencem ao
  Clerk. Quando o Clerk conclui a sessão, o frontend chama `POST /usuarios`
  para materializar a conta global da Fluy.
- `GET /usuarios/eu` retorna apenas a conta global, sem decidir se ela possui
  salão. A criação de salão é um fluxo posterior e independente.

- Modelagem já deve prever multi-usuário por salão (papéis, permissões), mas a UI de convite/gestão de funcionários está fora do MVP.
- No MVP, um usuário pode ter apenas um salão. Multi-salão para o mesmo dono está fora do escopo inicial.
- Cobrança do SaaS está adiada — no MVP o salão usa gratuitamente. Ver PENDENCIAS.md item 2.
- Dados fiscais do salão (CNPJ, razão social) não são coletados no MVP; entram quando começar cobrança.
