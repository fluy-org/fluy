# Bloco 5 — Ficha da cliente, histórico e lembretes

**Dono único: 🟣 Rudney.** Feature vertical completa: tudo que o salão vê e
registra *sobre uma cliente* fora da agenda.

Roda **em paralelo** com o [Bloco 6](./bloco-6-notificacoes.md).

## Por que este bloco existe assim

Ficha da cliente (2.8) e lembretes (3.1) estavam em blocos e donos diferentes,
mas são a mesma tela e as mesmas entidades: `nota` e `lembrete` vivem juntas em
[notas-e-lembretes.md](../domain/notas-e-lembretes.md), e as duas aparecem
cronologicamente na ficha. Separar significava dois devs no mesmo componente e
no mesmo módulo, em momentos diferentes.

Como o gatilho do lembrete automático é a conclusão do atendimento
([3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual)),
o bloco vai para o dono do Bloco 3: ele acopla o gancho no próprio service que
escreveu, sem handoff.

## Entregável do bloco

Ao final, o salão consegue:

- Listar clientes com busca, filtros e ordenação.
- Abrir a ficha: dados editáveis, timeline de agendamentos, métricas.
- Registrar notas cronológicas na cliente ou no agendamento.
- Receber lembretes de manutenção criados automaticamente ao concluir.
- Criar, listar, filtrar, editar e concluir lembretes manuais.

**Fora deste bloco:** galerias de imagens na ficha
([Bloco 8](./bloco-8-anexos-agendamento.md)) e a notificação do lembrete no dia
alvo ([Bloco 6](./bloco-6-notificacoes.md)) — a aba de lembretes funciona sem
push, listando o que vence hoje.

## Estado do schema

`cliente`, `nota` e `lembrete` (com `ORIGEM_LEMBRETE = ['automatica','manual']`
e `STATUS_LEMBRETE = ['ativo','concluido']`) **já existem** em
`shared/schema/src/` desde [0.4](./bloco-0-fundacao.md). Nenhuma fatia aqui
cria tabela.

---

## Fatias

### 5.1 Lista e ficha da cliente

- [x] Lista completa de clientes e a ficha individual com dados, histórico e métricas. — **🟣 Rudney** — [DEP: 2.1](./bloco-2-motor.md#21-clientes) · [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual)

**Por que lista e ficha juntas:** são o mesmo fluxo (`11-clientes-historico.md`)
e a lista sem a ficha não entrega nada além do que a tela mínima de
[2.1](./bloco-2-motor.md#21-clientes) já faz. Juntas dão uma fatia de tamanho
normal que fecha o fluxo inteiro.

**O que deve existir**

*Backend — lista*

- Listagem paginada dos clientes do salão.
- Busca por nome ou WhatsApp.
- Filtros: com atendimento no último mês, novas, maior valor gasto.
- Ordenação configurável (ver decisão pendente sobre o padrão).

*Backend — ficha*

- Dados básicos da cliente + edição de nome, WhatsApp e observações livres.
- **Editar WhatsApp exige confirmação** — é a chave única no salão. Usa a mesma validação do cadastro (`whatsappClienteSchema`), no formato internacional definido pela [4.1](./bloco-4-cliente-final.md#41-acesso-público-e-identificação-da-cliente).
- Timeline **paginada** do histórico de agendamentos: data, procedimento, valor, estado, com link para o detalhe. Cliente com centenas de agendamentos não pode travar a tela.
- Métricas: total gasto acumulado, total de agendamentos, no-shows, cancelamentos e último atendimento. Derivadas de `agendamento` + `evento_agendamento` + `pagamento_agendamento`.
- **Histórico é imutável** — a ficha não permite editar nem apagar agendamento passado.
- Filtro por `salao_id` em toda query: o cadastro é específico do salão.

*Frontend*

- Aba "Clientes" no painel, com lista, busca e filtros.
- Ficha com dados básicos editáveis, timeline paginada, bloco de métricas.
- Atalho "Criar agendamento para esta cliente", levando à tela de [2.2a](./bloco-2-motor.md#22a-tela-de-agendamento-manual) com a cliente pré-selecionada.
- Estado vazio para cliente cadastrada que nunca agendou.
- **Slots reservados (vazios) para as duas galerias de imagens** — referência da cliente e anexos internos. A [8.2](./bloco-8-anexos-agendamento.md#82-imagens-de-referência-da-cliente-e-galerias-na-ficha) preenche; aqui fica só o espaço, para não redesenhar a ficha depois.

**Fora desta fatia**

- Notas e lembretes → 5.2.
- Galerias de imagens → [8.2](./bloco-8-anexos-agendamento.md#82-imagens-de-referência-da-cliente-e-galerias-na-ficha).
- Fora do MVP, confirmado nos fluxos: merge de cadastros duplicados, tags/categorias de cliente, exportar CSV, campo de aniversário.

**Decisões fechadas**

- **Ordem padrão da lista**: nome (A–Z). Último atendimento e maior valor gasto ficam como ordenações opcionais; "VIP por valor gasto" é a ordenação, não um filtro.
- **Métrica "total gasto"**: mesma regra do "total faturado" do [Bloco 7](./bloco-7-faturamento.md) — o que efetivamente entrou, menos reembolsos. Registrada em [domain/faturamento.md](../domain/faturamento.md#métricas-derivadas-da-ficha-da-cliente).
- **LGPD — direito à exclusão**: a inativação da [2.1](./bloco-2-motor.md#21-clientes) (soft delete em `cliente.removido_em`) segue como única remoção. Anonimização continua em aberto na pendência 3, fora desta fatia.
- **Editar WhatsApp**: as `sessao_cliente` seguem o cadastro (apontam para `cliente_id`); nada é apagado. A confirmação fica só no frontend.
- **Paginação**: cursor opaco, primeira do projeto — regra registrada em `backend/src/modules/CLAUDE.md` e `frontend/CLAUDE.md`.
- **Filtros**: segmentos "atendidas nos últimos 30 dias" e "novas" (cadastro nos últimos 30 dias), combináveis com o status da 2.1.
- **Ficha de cliente inativa**: abre em leitura, com reativar.

**Critério de conclusão**

`flows/salao/11-clientes-historico.md` nas partes de lista e ficha: buscar por
WhatsApp, abrir a ficha, ver a timeline com agendamentos concluídos/cancelados/
no-show criados no Bloco 3, conferir as métricas, editar dados básicos, e abrir
a ficha de uma cliente sem histórico.

**Tamanho estimado:** ~80-90 arquivos.

---

### 5.2 Notas e lembretes

- [ ] Notas cronológicas na cliente e no agendamento + lembretes automáticos e manuais com aba própria. — **🟣 Rudney** — [DEP: 5.1](#51-lista-e-ficha-da-cliente) · [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual)

**Por que juntas:** nos fluxos, uma nota **é** um lembrete sem data alvo — o
mesmo formulário, o mesmo ponto de entrada, e o campo de data decide qual das
duas coisas ela vira. Separar em duas fatias criaria dois PRs no mesmo
formulário e na mesma ficha.

**O que deve existir**

*Backend — notas*

- `nota` associada à cliente **ou** ao agendamento, com texto livre e autor.
- Listagem cronológica das notas de uma cliente, incluindo as feitas em agendamentos dela.

*Backend — lembretes*

- **Criação automática ao concluir**: quando o procedimento tem `periodo_manutencao_dias > 0`, a conclusão cria um `lembrete` com `data_alvo` = data da conclusão + o período, `origem = automatica`, texto padrão referenciando o procedimento, vinculado à cliente e ao agendamento. Acopla no `AgendamentoConclusaoService` de [3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual).
- **Só ao concluir.** Cancelamento e no-show não criam lembrete.
- Criação manual: texto livre + `data_alvo` opcional. Com data vira lembrete; sem data fica só como observação.
- Listagem filtrável por data (hoje, semana, mês, atrasados), por cliente e por origem.
- Editar data e texto, marcar como concluído (antes ou depois da data alvo) e excluir.
- `data_alvo` no passado é aceito.
- Cliente que faz 3 procedimentos com manutenção gera 3 lembretes — sem consolidação automática.
- Desativar o procedimento depois não invalida o lembrete já criado.

*Frontend*

- Aba "Lembretes" no painel, **separada da agenda** (regra explícita do fluxo 12: não misturar atendimento com to-do interno).
- Lista com data, cliente, texto e ações rápidas: concluir, editar, excluir.
- Filtros de data, cliente e origem.
- Formulário "Adicionar nota" acessível de dois pontos: o detalhe do agendamento ([3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento)) e a ficha da cliente (5.1), com data alvo opcional.
- Notas cronológicas exibidas na ficha e no detalhe do agendamento.
- **O indicador de observações no card da agenda passa a acender de verdade** — foi previsto vazio em [3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento).

**Fora desta fatia**

- Notificação in-app/push no dia alvo → [6.3](./bloco-6-notificacoes.md#63-tempo-real-no-painel). Sem ela, a aba ainda serve: o salão abre e vê o que vence hoje e o que está atrasado.
- **O sistema nunca manda mensagem para a cliente** — decisão de MVP; o lembrete só notifica o salão.
- Fora do MVP, confirmado nos fluxos: snooze rápido, recorrência, templates de mensagem, compartilhar lembrete com outro usuário.

**Decisões que precisam estar fechadas antes**

- Cliente excluída ou mesclada: os lembretes dela migram ou são excluídos junto? O fluxo 12 marca como política a definir. Liga com a decisão de LGPD da 5.1.
- Lembrete automático também na criação da cliente ("bem-vinda")? MVP: só ao concluir.

**Critério de conclusão**

`flows/salao/12-lembretes.md` ponta a ponta nos três caminhos: concluir um
atendimento de procedimento com período de manutenção e ver o lembrete
automático aparecer com a data certa; criar nota com data pela ficha e vê-la na
aba; criar nota sem data e conferir que ela fica só como observação. Mais os
filtros e o marcar-como-concluído.

**Tamanho estimado:** ~80-90 arquivos.

---

## Dependências

- [2.1](./bloco-2-motor.md#21-clientes) — `ClienteService` (mergeada muito antes).
- [Bloco 3](./bloco-3-painel-operacao.md) inteiro — **do mesmo dono**. A timeline mostra os estados terminais e o lembrete automático se pendura na conclusão.

Nenhuma dependência de trabalho em curso de outra pessoa.

**Este bloco destrava:** as galerias de
[8.2](./bloco-8-anexos-agendamento.md#82-imagens-de-referência-da-cliente-e-galerias-na-ficha)
e a notificação de lembrete de
[6.3](./bloco-6-notificacoes.md#63-tempo-real-no-painel).

## Sequência

5.1 → 5.2. A ficha precisa existir antes de receber as notas.
