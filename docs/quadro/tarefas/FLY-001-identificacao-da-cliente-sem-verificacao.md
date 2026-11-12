# FLY-001 · Identificação da cliente: o WhatsApp de outra pessoa dá acesso à conta dela

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Crítica |
| **Área** | Página pública do salão · Segurança e LGPD |
| **Origem** | Teste manual do dono, confirmado na auditoria |
| **Relacionadas** | [FLY-003 · Reserva pendente e expirada](./FLY-003-reserva-pendente-e-expirada.md), [FLY-019 · Página pública do salão](./FLY-019-pagina-publica-do-salao.md) |

## Descrição

A suspeita do dono se confirma. Basta digitar o WhatsApp de outra cliente para entrar na conta dela naquele salão.

### Como funciona hoje

1. O front gera um `crypto.randomUUID()` e guarda no `localStorage` como credencial do aparelho (`frontend/src/app/features/pagina-cliente/services/pagina-cliente.service.ts:262-266`).
2. A cliente informa nome e WhatsApp.
3. `ClienteRepository.identificarPublicamente` (`backend/src/modules/cliente/cliente.repository.ts:295-391`) procura a cliente pelo WhatsApp no salão.
4. Se encontra, liga a credencial nova a esse cadastro (upsert em `sessao_cliente`).

Ninguém confirma que a pessoa é dona do número. Não há código, OTP nem conferência do nome. O nome digitado é ignorado quando o cadastro já existe. Uma cliente removida é reativada sozinha (linhas 312-319).

### O que quem digita o número alheio passa a ver e fazer

- **Nome real** do dono do número: a resposta devolve o nome cadastrado (`cliente.mapper.ts:82-90`) e a tela mostra "Olá, {nome}". Isso permite descobrir o nome de quem tem um número.
- **Histórico de agendamentos**: procedimento, data, preço e estado (`agendamento-publico.service.ts:30-47`).
- **Imagens de referência** dos agendamentos. Podem ser fotos de rosto ou de corpo (`anexo-agendamento-publico.controller.ts`).
- **Avisos da cliente** (`aviso-publico.controller.ts`) e o arquivo `.ics` do agendamento.
- **Cancelar** agendamentos da vítima (`agendamento-publico.service.ts:88-116`). O sinal pago fica retido, ou seja, a vítima perde dinheiro.
- **Criar reservas e agendamentos** em nome dela, ocupando a agenda do salão.
- **Enviar imagens** para os agendamentos dela.

### Agravantes

- A dona do número não recebe nenhum aviso.
- As sessões não expiram nem podem ser revogadas: `sessao_cliente` não tem `expira_em`.
- "Agendar como outra pessoa" não apaga a credencial do aparelho (`pagina-cliente.page.ts:215-221`).
  - Ao recarregar, a identidade anterior volta.
  - Não existe "Sair".
  - Num aparelho compartilhado, a próxima pessoa vê o histórico da anterior.
- A credencial trafega em query string. O log da API remove a query (`app.module.ts:53`), mas proxy e CDN podem registrá-la.
- Não há limite de tentativas próprio em `/cliente/identificacao`, só o global de 100 req/min por IP (`env.schema.ts:65-66`).
  - Isso permite varrer números.
  - Também cria cadastros lixo com números inventados.
- `GET /reservas/checkout` e `/reservas/instituicoes` não exigem credencial (`backend/src/modules/pagamento/pagamento.controller.ts:54-78`) e expõem o nome do recebedor Pix do salão.

### O que a documentação diz

A dívida foi aceita no MVP ("MVP aceita WhatsApp inventado", em `docs/features/identificacao-cliente.md`; `docs/flows/PENDENCIAS.md`, item 7). Mas o risco registrado ali era só o "agendamento fantasma", e não o acesso aos dados e às ações de outra cliente.

## Comportamento esperado

- Informar um WhatsApp **não dá acesso** a nada que já pertence àquele número sem uma prova de posse.
- Quem informa um número já cadastrado consegue agendar normalmente, mas só vê e gerencia o que criou naquela sessão, até verificar a posse.
- O nome cadastrado de terceiros nunca é revelado.
- A cliente consegue sair da identificação no aparelho.
- A sessão expira e pode ser revogada.
- Tentativas repetidas de identificação são limitadas.

## O que precisa ser feito

### 1. Contenção imediata, sem canal de envio de código

**Sessão não verificada:**

- Quando o WhatsApp já existe, criar uma sessão "não verificada" (novo campo em `sessao_cliente`, por exemplo `verificada_em`).
- Ligar o agendamento à sessão que o criou (por exemplo `sessao_cliente_id` em `agendamento`).
- A sessão não verificada só lista, cancela e anexa imagens nos agendamentos que ela mesma criou.
- Sem histórico anterior, fotos antigas nem avisos.

**Nome:**

- Não devolver o nome cadastrado para a sessão não verificada.
- Saudar com o nome digitado ou só "Olá!".

**Saída do aparelho:**

- "Agendar como outra pessoa" e um novo botão "Sair" apagam a credencial local.
- Os dois também revogam a sessão no servidor (novo endpoint, por exemplo `DELETE /cliente/sessao`).

**Expiração:**

- Adicionar `expira_em` à sessão, com renovação a cada uso, por exemplo 90 dias.

**Limite de tentativas:**

- Throttle dedicado em `/cliente/identificacao`, por IP e por WhatsApp.
- Conferir se a API confia no proxy (`trust proxy`), para que o IP seja o da cliente e não o do proxy.

**Credencial fora da URL:**

- Mover a credencial da query string para um header.

### 2. Recuperar o acesso completo (decisão de produto)

Escolher o mecanismo e registrar em `docs/flows/PENDENCIAS.md`:

- **(a) Link mágico gerado pelo salão.** O salão gera no painel, na ficha da cliente, um link de uso único e envia pelo próprio WhatsApp (wa.me). Custo zero e não precisa de provedor.
- **(b) Código por WhatsApp ou SMS.** Exige contratar um provedor; hoje não existe nenhum em `backend/src/shared/providers`.

Até a decisão, a opção (1) já elimina a exposição.

### 3. Docs

- Atualizar `docs/features/identificacao-cliente.md` e `docs/flows/cliente/01-primeiro-acesso.md` e `02-retorno.md` com as regras de sessão verificada e não verificada.
- Atualizar o item 7 de `PENDENCIAS.md` com o risco real, que é dado pessoal e dano financeiro (LGPD).

### 4. Testes automatizados

A regra é crítica, no mesmo nível do guard multi-tenant. Cobrir:

- a sessão não verificada não lista agendamentos de outra sessão;
- a sessão não verificada não cancela agendamentos de outra sessão;
- a sessão não verificada não recebe o nome cadastrado;
- a sessão revogada ou expirada é recusada.

## Critérios de conclusão

- [ ] Informar o WhatsApp de uma cliente existente em outro aparelho **não** mostra o nome, os agendamentos, as fotos nem os avisos dela.
- [ ] Nesse cenário, a pessoa consegue agendar, e o agendamento novo fica visível só para a sessão que o criou.
- [ ] Nenhum endpoint público permite cancelar ou anexar imagens em agendamento que não pertence à sessão.
- [ ] "Sair" e "Agendar como outra pessoa" limpam o aparelho e invalidam a sessão no servidor.
- [ ] As sessões expiram.
- [ ] Repetir a identificação muitas vezes seguidas recebe um bloqueio temporário com mensagem amigável.
- [ ] Existe um mecanismo decidido e documentado para recuperar o acesso completo.
- [ ] Os testes automatizados cobrem as regras acima.
