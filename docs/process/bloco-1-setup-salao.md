# Bloco 1 — Setup do salão

Todas as fatias necessárias para um salão se cadastrar, logar, e configurar o mínimo para operar.

## Entregável do bloco

A primeira etapa deste bloco materializa a conta global: depois de o Clerk
confirmar o e-mail, o frontend chama `POST /usuarios`. Só então o onboarding
cria o salão e o vínculo `usuario_salao` de dono. O frontend não cria
credenciais nem autentica senha; essas responsabilidades continuam no Clerk.

Ao final, um salão consegue:

- Criar seu salão e virar dono.
- Fazer login (com UX bonita).
- Editar configuração (tolerância, granularidade, antecedências).
- Cadastrar procedimentos com imagem.
- Configurar sua disponibilidade semanal + exceções por data.

**Ainda não** consegue criar agendamento (isso é Bloco 2).

## Fatias

- [x] **1.0** `auth/01-cadastro-e-conclusao` — telas de cadastro pelo Clerk e de `/concluir-cadastro`. Após confirmação do e-mail e sessão ativa, chama `POST /usuarios` para materializar a conta global e direciona para o onboarding. — **🟣 Rudney** — `[DEP: bloco 0]`
- [ ] **1.1** `salao/01-onboarding` — para uma conta global já materializada, tela "criar meu salão" (nome, subdomínio, whatsapp, endereço, fuso). Cria o salão e o vínculo `usuario_salao` como dono; popula `configuracao_salao` com defaults e cria o `profissional` inicial. — **🟣 Rudney** — `[DEP: 1.0]`
- [ ] **1.2** `salao/02-login` — tela de login com Clerk: cria a sessão, consulta `GET /usuarios/eu` e direciona para conclusão de cadastro, onboarding ou painel conforme o estado. — **🔵 Leandro** — `[DEP: 1.0]`
- [ ] **1.3** `salao/04-procedimentos` — CRUD completo de procedimentos, sem imagem (imagem entra em 1.6). Fullstack. — **🔵 Leandro** — `[DEP: 1.1 OU SEED-OK]`
- [ ] **1.4** `salao/03-disponibilidade` — janela semanal + override por data. Entities: `janela_semanal`, `override_disponibilidade`, `janela_override`. Fullstack. — **🟣 Rudney** — `[DEP: 1.1 OU SEED-OK]`
- [ ] **1.5** Feature `configuracao-do-salao` — tela pra editar `configuracao_salao` (granularidade, tolerância, antecedências, mensagem de confirmação). Backend já tem defaults; aqui é a UI. — **🔵 Leandro** — `[DEP: 1.1]`
- [ ] **1.6** Módulo de anexos (backend) + upload de imagem em procedimento (frontend). Entities: `imagem_procedimento` (a `arquivo` já foi criada em 0.4). — **🟣 Rudney** — `[DEP: 1.3]`

## Divisão e por quê

Fatias por dev:

**🔵 Leandro** (3): 1.2 (login UX — Angular puro), 1.3 (procedimentos — fullstack), 1.5 (config — mais frontend)
**🟣 Rudney** (4): 1.0 (cadastro e conclusão), 1.1 (onboarding — fullstack, começa cedo porque desbloqueia todo mundo), 1.4 (disponibilidade — regra de negócio densa no back), 1.6 (anexos — infra de storage no back)

**Alternância de stack:** 🔵 Leandro alterna entre UX puro (1.2, 1.5) e fullstack real (1.3). 🟣 Rudney começa pelo fluxo Angular da conta (1.0), segue para o onboarding fullstack (1.1) e depois pega as fatias backend-heavy (1.4, 1.6).

**Balanceamento:** Rudney assume uma fatia a mais porque 1.0 e 1.1 formam o fluxo contínuo de criação de conta e salão. 1.1 vai ser mais longa, mas 1.6 também exige infra de storage nova (S3? disco local? decidir).

**Sequência sugerida:**

1. 🟣 Rudney começa 1.0, que materializa a conta global.
2. 🟣 Rudney segue para 1.1; 🔵 Leandro inicia 1.2 assim que 1.0 estiver disponível.
3. Quando 1.1 sair, os dois puxam de suas listas.

## Decisões pendentes deste bloco

- [ ] Onde fica a imagem em 1.6? (S3 / R2 / disco local no Docker). Impacta setup de staging também.
- [ ] Slugs de subdomínio em 1.1: validar formato? reservar palavras (`admin`, `www`, `api`)?
- [ ] "Esqueci senha" em 1.2 entra no MVP? Se sim, habilitar o fluxo correspondente no Clerk.

## Conflitos previstos e mitigação

- 1.3 e 1.6 tocam a mesma entity `procedimento` (1.6 adiciona campo `imagem_id`). 🟣 Rudney faz 1.6 **depois** de 1.3 mergeada. Se coincidir na mesma semana, coordena verbalmente.
- Nenhum outro conflito esperado — telas e controllers diferentes.
