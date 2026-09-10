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

## Divisão do bloco

Diferente do plano original (fatias fullstack), este bloco fica dividido por camada:

- **🟣 Rudney** cuida do **backend** (endpoints, entities, regra de negócio, migrations).
- **🔵 Leandro** cuida do **frontend** (telas, services HTTP, integração com Clerk).

Motivo: no momento inicial 🟣 Rudney tem mais tempo pra codar, e 🔵 Leandro chega no front com API já pronta — menos bloqueio, mais velocidade. Cross-over acontece no fim do bloco (ver "Nota sobre cross-over" no final).

## Fatias concluídas

- [x] **1.0** `auth/01-cadastro-e-conclusao` — cadastro pelo Clerk + `POST /usuarios` materializando a conta global. — **🟣 Rudney**
- [x] **1.1** `salao/01-onboarding` — para conta global materializada, cria salão + vínculo `usuario_salao` dono, popula `configuracao_salao` com defaults e cria o `profissional` inicial. — **🟣 Rudney**

## Fatias — Backend (🟣 Rudney)

- [x] **1.2-BE** Login — endpoint `GET /usuarios/eu` (`404` para sem-cadastro; retorna estado `sem-salao` ou `com-salao` para conta existente) pra o frontend decidir pra onde redirecionar depois do Clerk criar sessão. — `[DEP: 1.0]`
- [x] **1.3-BE** Procedimentos — CRUD completo de procedimentos (sem imagem, imagem entra em 1.6-BE). Entity `procedimento`. Endpoints: `POST/GET/PUT/DELETE /procedimentos`. — `[DEP: 1.1]`
- [x] **1.4-BE** Disponibilidade — janela semanal + override por data. Entities: `janela_semanal`, `override_disponibilidade`, `janela_override`. Endpoints de leitura/escrita das janelas por profissional. — `[DEP: 1.1]`
- [x] **1.5-BE** Configuração do salão — endpoints `GET/PUT /salao/configuracao` (o salão já é criado com defaults em 1.1; aqui é só o CRUD de edição). — `[DEP: 1.1]`
- [x] **1.6-BE** Anexos — módulo de storage + upload de arquivos. Entity `imagem_procedimento`. Endpoints `POST /arquivos`, `POST/PUT /procedimentos` com `imagem.arquivo_id`, `DELETE /procedimentos/:id/imagem` e rota pública direta da imagem. — `[DEP: 1.3-BE]` `[STORAGE: Cloudflare R2 via adapter S3-compatible]`

## Fatias — Frontend (🔵 Leandro)

- [x] **1.2-FE** Tela de login com Clerk — usa Clerk SDK pra sessão, chama `GET /usuarios/eu` e direciona pra `/concluir-cadastro`, `/onboarding` ou `/painel` conforme o estado retornado. — `[DEP: 1.2-BE]` `[SEED-OK]`
- [x] **1.3-FE** Tela de procedimentos — lista + form de criar/editar/deletar. Consome API de 1.3-BE. — `[DEP: 1.3-BE]` `[SEED-OK]`
- [ ] **1.4-FE** Tela de disponibilidade — grade semanal editável + calendário de exceções. Consome API de 1.4-BE. — `[DEP: 1.4-BE]` `[SEED-OK]`
- [x] **1.5-FE** Tela de configuração do salão — form pra editar granularidade, tolerância, antecedências, mensagem de confirmação. Consome API de 1.5-BE. — `[DEP: 1.5-BE]` `[SEED-OK]`
- [x] ⚡ **1.6-FE** Upload de imagem em procedimento — componente de upload na tela de 1.3-FE, chama endpoint de 1.6-BE. — `[DEP: 1.3-FE, 1.6-BE]`

## Sequência sugerida

**🟣 Rudney** puxa as fatias BE em ordem: 1.2-BE → 1.3-BE → 1.4-BE → 1.5-BE → 1.6-BE. Cada uma destrava a FE correspondente.

**🔵 Leandro** pega FE conforme a BE fica pronta. Ordem sugerida: 1.2-FE (mais crítica pro fluxo) → 1.3-FE → 1.5-FE → 1.4-FE → 1.6-FE. Se alguma BE atrasar, pode adiantar outra FE via `[SEED-OK]`.

Se 🔵 Leandro terminar todas as FE antes de 🟣 Rudney terminar as BE, ele começa a olhar Bloco 2 do lado do frontend, ou entra numa fatia BE simples pra iniciar cross-over.

## Decisões pendentes deste bloco

- [ ] Onde fica a imagem em 1.6-BE (S3 / R2 / disco local no Docker). Impacta setup de staging também.
- [ ] "Esqueci senha" em 1.2 entra no MVP? Se sim, habilitar o fluxo correspondente no Clerk.

## Conflitos previstos e mitigação

- 1.3-BE e 1.6-BE tocam a mesma entity `procedimento` (1.6 adiciona campo `imagem_id`). 🟣 Rudney faz 1.6-BE **depois** de 1.3-BE mergeada.
- Nenhum outro conflito esperado — camadas separadas, telas separadas.

## Nota sobre cross-over

Este bloco quebra o padrão de "fatias fullstack alternando stacks". Aceito como fase inicial pra ganhar velocidade, mas com salvaguardas:

1. **Code review cross-stack** — 🔵 Leandro revisa PRs de backend de 🟣 Rudney (mesmo sem mexer, só pra ver padrões emergindo) e vice-versa.
2. **Padrões novos vão pra `CLAUDE.md`** — se um lado inventa uma convenção, documenta no `backend/CLAUDE.md` ou `frontend/CLAUDE.md` no mesmo PR, pra o outro lado achar quando chegar.
3. **Última fatia trocada de propósito** — quando o Bloco 1 estiver quase fechando, a última fatia (a decidir qual) muda de dono: 🟣 Rudney pega uma FE, 🔵 Leandro pega uma BE. Ritual pra quebrar o hábito antes do Bloco 2.
