# Bloco 4 — Cliente final (página pública)

**Dono único: 🔵 Leandro.** Feature vertical completa: a superfície pública que
a cliente do salão usa no celular. Diferencial do produto.

Roda **em paralelo** com o [Bloco 3](./bloco-3-painel-operacao.md). Superfície
diferente, rotas diferentes, modelo de identidade diferente (`sessao_cliente`,
sem Clerk). Não compartilha tela nem service com o painel.

## Por que este bloco existe assim

No plano anterior, 4.1/4.2/4.4 eram de um dev e 4.3 (criação de agendamento) do
outro — quebrando o fluxo da cliente exatamente no meio: quem construía a
identificação não conseguia testar o que ela habilita, e quem construía o
agendamento não conseguia rodar o fluxo sem a identificação do outro.

Com dono único, a superfície pública inteira é desenvolvida, testada e validada
sozinha: dá pra abrir a página do salão no celular, se identificar, marcar e
cancelar, sem depender de nada do painel.

## Entregável do bloco

Ao final, a cliente do salão consegue:

- Acessar a página pública do salão pelo celular.
- Ser identificada por UUID de dispositivo + WhatsApp, sem conta nem senha.
- Ser reconhecida automaticamente ao voltar; ou agendar como outra pessoa.
- Ver os procedimentos ativos e os horários livres.
- Marcar horário sozinha (direto em `agendado`, sem pagamento).
- Ver seus agendamentos e cancelar.

**Fora deste bloco:** sinal e estado `reservado`
([Bloco 9](./bloco-9-pagamento-online.md)), push/`.ics`/avisos in-app
([Bloco 6](./bloco-6-notificacoes.md)), imagens de referência
([Bloco 8](./bloco-8-anexos-agendamento.md)).

## Estado do schema

`cliente`, `sessao_cliente` (com `TIPO_SESSAO_CLIENTE = ['uuid_dispositivo']`),
`agendamento` e `procedimento` **já existem** em `shared/schema/src/` desde
[0.4](./bloco-0-fundacao.md). Nenhuma fatia aqui cria tabela.

## Roteamento — decidido

A página pública é servida em **`/s/:subdominio`** no MVP. Sem wildcard DNS nem
TLS curinga. A resolução de tenant fica isolada em um único ponto, e a troca
futura para host real (`nome.fluy.app`) mexe só nesse resolver — ver
[notas](#notas).

> **Atenção ao que já existe.** [0.7](./bloco-0-fundacao.md) deixou um scaffold
> em `frontend/src/app/features/pagina-cliente/` registrado como **`/:subdominio`
> na raiz** (rota curinga no fim das rotas públicas). Isso colide por desenho
> com todo caminho de primeiro nível: hoje `login`, `cadastro` e `onboarding`
> ganham porque vêm antes, mas qualquer rota nova criada depois passa a
> **sequestrar em silêncio** o salão cujo subdomínio tenha o mesmo nome. Mover
> para `/s/:subdominio` elimina a classe inteira de bug e é uma mudança de
> poucas linhas no scaffold — a 4.1 já entra com ela.

---

## Fatias

### 4.1 Acesso público e identificação da cliente

- [x] Página pública do salão + identificação por UUID de dispositivo e WhatsApp, incluindo o reconhecimento no retorno. — **🔵 Leandro** — [DEP: 1.1](./bloco-1-setup-salao.md#11-onboarding) · [DEP: 2.1](./bloco-2-motor.md#21-clientes) `[DECIDIR: LGPD mínimo — consentimento + política de privacidade]`

**Por que o retorno entra junto:** o fluxo `02-retorno.md` não tem tela nem
endpoint próprio — é o mesmo serviço de identificação decidindo entre "conheço
este UUID" e "não conheço". Separado, seria um PR de poucos arquivos; junto,
fecha a identificação inteira e permite testar os dois fluxos de uma vez.

**O que deve existir**

*Backend*

- Resolver de tenant a partir de `:subdominio`, devolvendo o salão e os dados públicos dele (nome, endereço, contato). Subdomínio inexistente retorna 404.
- Rotas públicas registradas como exceção explícita no guard global de auth (padrão já existente desde [0.3](./bloco-0-fundacao.md) e da rota pública de imagem de procedimento em [1.6-BE](./bloco-1-setup-salao.md#16-be-anexos)).
- Identificação: recebe nome + WhatsApp, **busca cadastro existente no salão pelo WhatsApp**; se existe, reutiliza e associa o novo UUID; se não, cria `cliente` novo. Usa o `ClienteService` de [2.1](./bloco-2-motor.md#21-clientes), não duplica regra de cadastro.
- `sessao_cliente` com `tipo = uuid_dispositivo` e o UUID como credencial. **Um cadastro pode ter N sessões** (a mesma pessoa em vários dispositivos, unificada pelo WhatsApp).
- Resolução do UUID no retorno: devolve o cadastro associado. UUID desconhecido neste salão, ou cadastro removido, responde como se fosse primeiro acesso.
- Normalização do WhatsApp em formato internacional no armazenamento, e validação de formato na entrada.
- Toda query escopada pelo salão resolvido na rota.

*Frontend*

- Layout público mobile-first, sem menu do painel, no shell público criado em [0.9](./bloco-0-fundacao.md).
- Tela de primeiro acesso: nome + WhatsApp, com erro de formato inline.
- Tela de retorno: "Olá, [Nome]" com **Continuar como [Nome]** e **Agendar como outra pessoa**.
- "Agendar como outra pessoa" cai no formulário de identificação e **reescreve o UUID do dispositivo** para a nova identidade.
- Persistência do UUID no dispositivo, específica por salão (cliente que usa 2 salões tem 2 UUIDs).
- Consentimento LGPD e link para a política de privacidade no primeiro acesso.
- Modo anônimo e storage limpo caem em primeiro acesso, sem erro.
- Reaproveitar o scaffold de `features/pagina-cliente/` de [0.7](./bloco-0-fundacao.md), movendo a rota de `/:subdominio` para `/s/:subdominio`.

*Frontend — painel*

- **O salão precisa de onde ver e copiar o link público do seu salão.** Sem isso, o Bloco 4 entrega uma página que ninguém consegue divulgar. A capacidade "gerenciar subdomínio público" está em [configuracao-do-salao.md](../features/configuracao-do-salao.md), mas não foi entregue na [1.5](./bloco-1-setup-salao.md#15-be-configuracao-do-salao) e nenhum outro bloco a cobria. Entra aqui: exibir o link na tela de configuração do salão, com ação de copiar.
- Alterar o subdomínio fica **fora do MVP** — trocá-lo quebra os links já divulgados e invalida os UUIDs de dispositivo, que são por salão. Só exibir.

**Fora desta fatia**

- Qualquer coisa de agendamento (4.2 e 4.3).
- Fora do MVP, confirmado nos fluxos: recuperar acesso por código no WhatsApp, validar o WhatsApp de verdade, trocar entre várias identidades salvas no mesmo dispositivo, expirar o UUID por inatividade, merge de cadastros duplicados.

**Decisões que precisam estar fechadas antes**

- **LGPD mínima** (ambig #10, pendência 3): qual consentimento aparece no primeiro acesso e onde fica a política de privacidade? **Bloqueia esta fatia.**
- **Validação de WhatsApp** (pendência 7): MVP aceita sem validar, correndo risco de agendamento fantasma. Confirmar.

**Critério de conclusão**

Copiar o link do painel, abrir no celular e chegar na página do salão. Mais
`flows/cliente/01-primeiro-acesso.md` e `flows/cliente/02-retorno.md` ponta a
ponta no celular: primeiro acesso cria cadastro; segundo acesso reconhece;
mesmo WhatsApp em outro dispositivo reusa o cadastro e cria segunda sessão;
"agendar como outra pessoa" troca a identidade do dispositivo; limpar o storage
volta ao primeiro acesso sem perder histórico ao reinformar o WhatsApp.

**Tamanho estimado:** ~70-80 arquivos.

---

### 4.2 Criação de agendamento pela cliente

- [x] Catálogo público, escolha de dia e horário, e confirmação — indo direto para `agendado`, sem pagamento. — **🔵 Leandro** — [DEP: 4.1](#41-acesso-público-e-identificação-da-cliente) `[BLOQ:gateway — sinal, estado reservado e expira_em ficam para 9.2]`

**O que deve existir**

*Backend*

- Controller público escopado pela sessão da cliente, **reusando os endpoints do motor** ([2.2b](./bloco-2-motor.md#22b-motor-de-agendamento)): horários livres, avaliação e criação. A regra de disponibilidade não é reescrita aqui.
- Listagem dos procedimentos **ativos** do salão com nome, descrição, imagem, duração e preço.
- Criação direto em `agendado`, com duração, preço total e sinal **congelados** no ato.
- Revalidação da disponibilidade no momento de confirmar (proteção contra o salão ter mudado a janela durante o fluxo, e contra race entre duas clientes).
- Procedimento que ficou inativo entre a seleção e a confirmação é rejeitado com mensagem clara.
- Antecedência mínima e máxima de `configuracao_salao` filtram os dias oferecidos.

*Frontend*

- Lista de procedimentos ativos.
- Calendário/lista de dias disponíveis, respeitando as antecedências.
- Lista de horários de início do dia escolhido.
- Tela de confirmação com: data, horário, procedimento, endereço do salão, informações pré-procedimento, mensagem personalizada do salão e política de atraso (tolerância).
- Erro claro quando o slot foi tomado no meio do caminho, devolvendo para a escolha de horário.

**Fora desta fatia**

- **Todo o pagamento**: resumo de valores a pagar, escolha entre sinal e total, checkout e o estado `reservado` com `expira_em` → [9.2](./bloco-9-pagamento-online.md#92-sinal-e-checkout-no-fluxo-da-cliente). Nesta fatia o agendamento nasce direto em `agendado`.
- Upload de imagens de referência → [8.2](./bloco-8-anexos-agendamento.md#82-imagens-de-referência-da-cliente-e-galerias-na-ficha).
- "Adicionar ao calendário", opt-in de push e a notificação ao salão → [Bloco 6](./bloco-6-notificacoes.md).
- Fora do MVP, confirmado nos fluxos: mais de um procedimento por agendamento, cliente escolher a profissional.

**Decisões que precisam estar fechadas antes**

- Cliente pode ter múltiplos agendamentos ativos simultâneos no mesmo salão? Os docs dizem "provavelmente sim; confirmar". Mesma decisão do [Bloco 2](./bloco-2-motor.md#decisões-pendentes-deste-bloco) — vale para os dois.

**Critério de conclusão**

`flows/cliente/03-criacao-agendamento.md` ponta a ponta, **pulando os passos 10
a 15** (pagamento): escolher procedimento, dia e horário, confirmar, e ver o
agendamento aparecer na agenda do dia do painel ([3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento))
no horário certo.

**Tamanho estimado:** ~65-75 arquivos.

---

### 4.3 Meus agendamentos e cancelamento

- [x] Lista dos agendamentos da cliente identificada e cancelamento do próprio agendamento. — **🔵 Leandro** — [DEP: 4.2](#42-criação-de-agendamento-pela-cliente) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) `[SEED-OK]`

**O que deve existir**

*Backend*

- Listagem dos agendamentos da cliente resolvida pela sessão do dispositivo — nunca por id de cliente vindo do request.
- Cancelamento pela cliente, **consumindo o `AgendamentoCancelamentoService` de [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento)**, com política de autorização própria: só os próprios agendamentos, e só em `agendado`. Grava `cancelado_por = 'cliente'` no evento (entrou na [7.1](./bloco-7-faturamento.md#71-agregação-de-período)), que o faturamento usa como motivo do sinal retido.
- **Sem antecedência mínima** — pode cancelar até segundos antes do horário.
- Slot liberado imediatamente.
- Estados terminais e agendamentos de outra cliente retornam erro; race com uma ação do salão resolve por "primeiro vence".

*Frontend*

- Lista dos agendamentos da cliente, com estado visível.
- Detalhe do agendamento.
- Ação de cancelar apenas em `agendado`, com **confirmação explícita** de que o sinal pago não será devolvido (texto do fluxo 04, com o valor).
- Lista atualizada após o cancelamento.

**Fora desta fatia**

- Notificar o salão do cancelamento → [6.3](./bloco-6-notificacoes.md#63-tempo-real-no-painel).
- Cliente remarcar sozinha — **fora do MVP por decisão**; ela contata o salão, que remarca pelo painel.
- Recuperar acesso sem o UUID — fora do MVP; a cliente fala com o salão.

**Sobre o `[DEP: 3.3]`**

É a única costura deste bloco com o Bloco 3: a transição para `cancelado` é a
mesma, muda só quem autoriza. Pela sequência de trabalho, 3.3 já estará
mergeada quando esta fatia abrir. Se não estiver, implementar o endpoint
público consumindo o service assim que ele existir — **não redesenhar a
transição aqui**.

**Critério de conclusão**

`flows/cliente/04-cancelamento.md` ponta a ponta: cancelar um agendamento
próprio, conferir que o slot volta a aparecer nos horários livres e que o card
aparece como `cancelado` na agenda do painel. Conferir que a cliente não
consegue ver nem cancelar agendamento de outra pessoa.

**Tamanho estimado:** ~45-55 arquivos.

---

## Dependências

- [2.1](./bloco-2-motor.md#21-clientes) — `ClienteService` para buscar/criar cadastro por WhatsApp. **É a única dependência externa real do bloco**, e é a primeira fatia do 🔵 Leandro no Bloco 2 — dele mesmo.
- [2.2b](./bloco-2-motor.md#22b-motor-de-agendamento) — motor (mergeado).
- [1.3-BE](./bloco-1-setup-salao.md#13-be-procedimentos) e [1.4-BE](./bloco-1-setup-salao.md#14-be-disponibilidade) — catálogo e janelas (mergeadas).
- [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) — só para a fatia 4.3 (ver acima).

**Este bloco destrava:** [Bloco 6](./bloco-6-notificacoes.md) (é aqui que
nascem os eventos "novo agendamento" e "cancelamento pela cliente"),
[8.2](./bloco-8-anexos-agendamento.md#82-imagens-de-referência-da-cliente-e-galerias-na-ficha)
e [9.2](./bloco-9-pagamento-online.md#92-sinal-e-checkout-no-fluxo-da-cliente).

## Sequência

4.1 → 4.2 → 4.3. Ao fim de 4.2 já dá pra rodar os três primeiros fluxos da
cliente e conferir o resultado no painel.

## Notas

- **Sem Clerk nesta superfície.** A identidade da cliente é `sessao_cliente` (UUID de dispositivo), não um token de auth.
- **Resolução de tenant em um ponto só.** O MVP lê o `:subdominio` do path; a troca futura para host (`nome.fluy.app`) deve mexer só nesse resolver. Nenhum service abaixo dele pode saber de onde veio o salão — é o que torna a migração barata quando houver DNS e TLS curinga.
- **Multi-tenant é o ponto mais sensível do bloco:** o salão vem da rota, não de um token, e toda query continua filtrando por `salao_id`. Vale teste automatizado — é guard multi-tenant, uma das quatro áreas com teste obrigatório no [CLAUDE.md](../../CLAUDE.md).
