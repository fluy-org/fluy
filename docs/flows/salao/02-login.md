# Salão — Login

## Objetivo

Autenticar o usuário do salão para acessar o painel administrativo, com suporte a email+senha e Google OAuth.

## Passo a passo

1. Usuário acessa a URL de login do painel do salão.
2. Sistema exibe opções:
   - Email + senha
   - Continuar com Google
3. **Fluxo email+senha:**
   - Usuário digita email e senha.
   - Sistema valida credenciais.
   - Se OK: cria sessão e redireciona para o painel.
   - Se erro: mensagem genérica ("email ou senha incorretos") sem revelar qual campo falhou.
4. **Fluxo Google OAuth:**
   - Usuário clica em "Continuar com Google".
   - Sistema redireciona para autorização Google.
   - Usuário autoriza.
   - Google retorna com identidade (email verificado).
   - Sistema verifica se existe conta com aquele email.
     - **Existe:** faz login; associa Google se ainda não estava associado.
     - **Não existe:** cria conta nova (mas sem salão configurado — cai no fluxo de [onboarding](./01-onboarding.md) para completar setup).

## Variações

- **Sucesso email+senha:** login realizado, sessão criada.
- **Sucesso Google:** login realizado, sessão criada.
- **Senha incorreta:** mensagem genérica, tentativa liberada.
- **Múltiplas tentativas falhas:** rate limit / captcha após N tentativas (proteção brute force).
- **Esqueci a senha:** fluxo de reset via email.
- **Conta desativada/suspensa:** mensagem específica indicando contatar suporte.
- **Usuário fez login por Google mas cadastrou originalmente com senha:** sistema associa Google à conta existente (mesmo email); próximo login por qualquer método funciona.

## Regras de negócio

- **Email é único no sistema (por usuário).**
- **Sessão persistente** (cookie longo) por padrão — salão não quer fazer login toda vez que abre o painel.
- **Logout explícito** disponível em qualquer tela.
- **Recuperação de senha via email** (link de reset com expiração curta, ex.: 1h).
- **Google OAuth só aceita emails verificados** pelo Google (evita conta forjada).
- No MVP: **um usuário = um salão**. Modelagem preparada para multi-usuário/multi-salão, mas UI não expõe.

## Dependências

- **Onboarding do salão** para primeira criação da conta.
- **Provedor de email** para reset de senha.
- **Google Cloud Console** para credenciais OAuth.
- **Middleware de sessão/auth** para proteger rotas do painel.

## Casos extremos (edge cases)

- **Usuário loga com Google usando email diferente do original:** cria conta nova (email diferente); precisa refazer setup. Considerar detectar por identidade Google e sugerir merge (fora do MVP).
- **Google desassocia a conta / usuário perde acesso:** email+senha permanece como fallback (se o usuário configurou senha).
- **Usuário nunca configurou senha (só Google) e Google fica indisponível:** precisa fluxo de "definir senha" para fallback. Ver dúvidas em aberto.
- **Sessão expira durante ação crítica** (ex.: criando agendamento manual): sistema pede login novamente; idealmente preserva o estado da ação para retomar.
- **Login em múltiplos dispositivos simultaneamente:** permitido; cada dispositivo tem sua sessão.
- **Trocar de email:** fluxo de "alterar email" (com confirmação no email novo). Fora do escopo mínimo.

## Dúvidas em aberto

- **Autenticação de dois fatores (2FA):** salão gerencia dados sensíveis (clientes, financeiro); vale oferecer 2FA opcional? Fora do MVP.
- **"Definir senha" para conta criada só via Google:** para permitir fallback, precisa oferecer isso em algum momento. Fora do MVP se aceitarmos que perder acesso ao Google = suporte manual.
- **Duração da sessão:** 30 dias? Indefinida com "lembrar de mim"? Não decidido.
- **Login por WhatsApp (código enviado):** modelo simpler para clientes brasileiros; considerar para v2.
