# Bloco 1 — Setup do salão

Todas as fatias necessárias para um salão se cadastrar, logar, e configurar o mínimo para operar.

## Entregável do bloco

A criação da conta global já ocorreu antes deste bloco: Clerk confirma o e-mail
e o frontend chama `POST /usuarios`. Este bloco cria o salão e o vínculo
`usuario_salao` de dono; ele não cria credenciais nem autentica senha.

Ao final, um salão consegue:
- Criar seu salão e virar dono.
- Fazer login (com UX bonita).
- Editar configuração (tolerância, granularidade, antecedências).
- Cadastrar procedimentos com imagem.
- Configurar sua disponibilidade semanal + exceções por data.

**Ainda não** consegue criar agendamento (isso é Bloco 2).

## Fatias

- [ ] **1.1** `salao/01-onboarding` — para uma conta global já concluída, tela "criar meu salão" (nome, subdomínio, whatsapp, endereço, fuso). Cria o salão e o vínculo `usuario_salao` como dono; popula `configuracao_salao` com defaults e cria o `profissional` inicial. — **🟣 Rudney** — `[DEP: bloco 0]`
- [ ] **1.2** `salao/02-login` — tela de login com Clerk (sessão, tratamento de erro e redirecionamento para conclusão de cadastro ou onboarding) — **🔵 Leandro** — `[SEED-OK]`
- [ ] **1.3** `salao/04-procedimentos` — CRUD completo de procedimentos, sem imagem (imagem entra em 1.6). Fullstack. — **🔵 Leandro** — `[DEP: 1.1 OU SEED-OK]`
- [ ] **1.4** `salao/03-disponibilidade` — janela semanal + override por data. Entities: `janela_semanal`, `override_disponibilidade`, `janela_override`. Fullstack. — **🟣 Rudney** — `[DEP: 1.1 OU SEED-OK]`
- [ ] **1.5** Feature `configuracao-do-salao` — tela pra editar `configuracao_salao` (granularidade, tolerância, antecedências, mensagem de confirmação). Backend já tem defaults; aqui é a UI. — **🔵 Leandro** — `[DEP: 1.1]`
- [ ] **1.6** Módulo de anexos (backend) + upload de imagem em procedimento (frontend). Entities: `imagem_procedimento` (a `arquivo` já foi criada em 0.4). — **🟣 Rudney** — `[DEP: 1.3]`

## Divisão e por quê

Fatias por dev:

**🔵 Leandro** (3): 1.2 (login UX — Angular puro), 1.3 (procedimentos — fullstack), 1.5 (config — mais frontend)
**🟣 Rudney** (3): 1.1 (onboarding — fullstack, começa cedo porque desbloqueia todo mundo), 1.4 (disponibilidade — regra de negócio densa no back), 1.6 (anexos — infra de storage no back)

**Alternância de stack:** 🔵 Leandro alterna entre UX puro (1.2, 1.5) e fullstack real (1.3). 🟣 Rudney alterna entre fullstack (1.1) e backend-heavy (1.4, 1.6). Ninguém fica um bloco inteiro em um lado só.

**Balanceamento:** 3 fatias cada. 1.1 vai ser mais longa (raiz do bloco), mas 1.6 exige infra de storage nova (S3? disco local? decidir) — se equilibra.

**Sequência sugerida:**
1. 🟣 Rudney começa 1.1 (bloqueia todos os outros).
2. 🔵 Leandro começa 1.2 em paralelo (pode usar seed até 1.1 sair).
3. Quando 1.1 sair, os dois puxam de suas listas.

## Decisões pendentes deste bloco

- [ ] Onde fica a imagem em 1.6? (S3 / R2 / disco local no Docker). Impacta setup de staging também.
- [ ] Slugs de subdomínio em 1.1: validar formato? reservar palavras (`admin`, `www`, `api`)?
- [ ] "Esqueci senha" em 1.2 entra no MVP? Se sim, habilitar o fluxo correspondente no Clerk.

## Conflitos previstos e mitigação

- 1.3 e 1.6 tocam a mesma entity `procedimento` (1.6 adiciona campo `imagem_id`). 🟣 Rudney faz 1.6 **depois** de 1.3 mergeada. Se coincidir na mesma semana, coordena verbalmente.
- Nenhum outro conflito esperado — telas e controllers diferentes.
