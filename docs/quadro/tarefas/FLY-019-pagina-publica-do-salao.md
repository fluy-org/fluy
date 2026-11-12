# FLY-019 · Página pública do salão: ajustes de layout, conteúdo e app instalado

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média (o item 1 é **alta** e pode ir sozinho antes) |
| **Área** | Página pública do salão (cliente final) |
| **Origem** | Teste manual do dono ("Que bom ter você de volta") + auditoria |
| **Relacionadas** | [FLY-001 · Identificação da cliente](./FLY-001-identificacao-da-cliente-sem-verificacao.md), [FLY-002 · Agendar sem pagamento online](./FLY-002-agendamento-sem-pagamento-online.md), [FLY-003 · Reserva pendente](./FLY-003-reserva-pendente-e-expirada.md) |

## Descrição

### 1. Mensagem de teste pessoal em produção

Qualquer cliente cujo primeiro nome seja "na", "nat", "nanat" ou "natasha", em **qualquer salão**, recebe um modal com a mensagem "Bem-vinda ao teste do Fluy, xuxu!… Parabéns por ser a primeira tester! 🥳🥳🥳".

- Lógica: `pagina-cliente.page.ts:199-201, 743-747`.
- Template: `pagina-cliente.page.html:303-343`.

É um resquício de teste que expõe o produto a uma situação constrangedora com clientes reais.

### 2. "Que bom ter você de volta" mal posicionado

O selo aparece colado no "Olá, {nome}" logo abaixo e fica cinza, quando deveria ter a cor de destaque.

- O selo é um `<ion-text class="etiqueta">` dentro de um `<div>` comum (`pagina-cliente.page.html:208-213`).
- O `ion-text` fica em linha, então o padding vertical de `.etiqueta` (`pagina-cliente.page.scss:54-62`) não empurra o título.
- A regra `.retorno-cliente ion-text { margin-top; color: muted }` (scss `133-137`) é mais específica que `.etiqueta`. Ela troca a cor do selo.
- Na seção de boas-vindas o mesmo selo funciona, porque o pai é `display: grid` (scss `32-35`).

### 3. Data crua e numeração de passos errada

- **Data em formato técnico.** "Horário selecionado" (`pagina-cliente.page.html:155`) e "Agendamento confirmado" (`:86`) mostram a data como `2026-11-15`.
- **Dois passos com o número 2.** O catálogo é o passo "2" (`catalogo-procedimentos.component.html:3`), e data e horário também é "2" (`escolha-horario.component.html:3`). A revisão é o passo 3.

### 4. Informações do salão

- **WhatsApp sem link.** Na tela inicial, o WhatsApp do salão é texto puro (`pagina-cliente.page.html:199-204`).
- **Endereço repetido.** Aparece no cabeçalho e no card.
- **Ícone que parece botão.** O ícone de calendário do cabeçalho é decorativo e não faz nada (`cabecalho-publico.component.html:13`).

### 5. Mês sem dias livres

- Quando o mês não tem dias disponíveis, a data é zerada (`pagina-cliente.page.ts:456-460`).
- O bloco de horários só mostra mensagem quando há data selecionada (`escolha-horario.component.html:27`).
- A cliente fica sem orientação. Não foi confirmado se o calendário mensal mostra algo nesse caso.

### 6. Mensagens de erro genéricas ou técnicas

- Qualquer falha de identificação mostra "Não foi possível continuar. Tente novamente." (`pagina-cliente.page.ts:207-209`).
- "Sessão da cliente não encontrada." e "Pagamento não encontrado." chegam crus da API.
- Um 409 de estado no cancelamento mostra "Não foi possível cancelar. Atualize a lista e tente novamente."

### 7. "Meus agendamentos" pobre em informação

- A lista não mostra se o agendamento está pago ou pendente.
- Não há como adicionar imagem de referência.
- A ação de pagar e o prazo da reserva estão na [FLY-003](./FLY-003-reserva-pendente-e-expirada.md).

### 8. App instalado (PWA) abre no login do salão

- O `index.html:19` aponta só para `manifest.webmanifest`. Esse manifest tem `start_url "/"`, que redireciona para o login do salão.
- O `manifest-cliente.webmanifest` (`start_url /cliente`) é copiado como asset (`angular.json:33`), mas nunca é usado.
- O redirecionamento `redirecionarPwaCliente` (`app.routes.ts:8-22`) nunca é acionado pela instalação. Sem rota salva, ele também cai em `/login`.
- **Resultado:** a cliente que "adiciona à tela inicial" abre o app e vê a tela de login de salão.

### 9. Fotos enviadas antes do pagamento

- As imagens sobem para a reserva antes do pagamento (`pagina-cliente.page.ts:561-584`). Se a reserva expira, ficam órfãs no armazenamento.
- O arquivo é enviado ao R2 antes da checagem de limite (`backend/src/modules/anexo-agendamento/anexo-agendamento.service.ts:139-152`).
- O upload é aceito em qualquer estado do agendamento, inclusive cancelado.

## Comportamento esperado

1. **Mensagem de teste:** não existe nenhuma mensagem pessoal ou de teste no produto.
2. **Selo de retorno:** "Que bom ter você de volta" aparece como um selo destacado, separado do título por espaçamento.
3. **Datas e passos:**
   - as datas aparecem por extenso ("sáb, 15 de novembro");
   - os passos são numerados em sequência.
4. **Informações do salão:**
   - o WhatsApp do salão abre a conversa;
   - o endereço aparece uma vez;
   - nenhum ícone decorativo parece clicável.
5. **Mês sem vagas:**
   - aparece "Sem horários livres neste mês";
   - há atalho para o próximo mês com vaga e para o WhatsApp do salão.
6. **Erros:** as mensagens dizem o que aconteceu e o que fazer, sem termos internos.
7. **Meus agendamentos:**
   - mostra o status do pagamento;
   - permite adicionar uma referência a um agendamento ativo.
8. **App instalado:**
   - abre na página do salão em que a cliente estava;
   - sem rota salva, abre numa tela neutra para a cliente, nunca no login do salão.
9. **Fotos e reserva:**
   - as fotos de uma reserva expirada são descartadas;
   - o limite é checado antes do envio;
   - agendamento cancelado não aceita imagens.

## O que precisa ser feito

**Itens 1 e 2:**

- Remover o modal e a lógica da mensagem de teste. Pode ser entregue isoladamente, já.
- Ajustar o CSS do selo:
  - `.retorno-cliente > div { display: grid; gap: ... }`;
  - excluir a etiqueta da regra genérica (`.retorno-cliente ion-text:not(.etiqueta)`).

**Itens 3 e 4:**

- Formatar a data com o mesmo formatador da revisão, respeitando o fuso do salão.
- Corrigir a numeração dos passos.
- WhatsApp do salão com link wa.me.
- Remover a duplicidade do endereço.
- Remover ou tornar funcional o ícone do cabeçalho.

**Item 5:**

- Estado vazio quando o mês não tem dias livres, com os atalhos.

**Item 6:**

- Revisar as mensagens de erro da identificação, do cancelamento e do checkout. Ver também a [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md).

**Item 7:**

- Incluir o status de pagamento na lista e no detalhe (backend público de agendamento).
- Ação "Adicionar referência", com a mesma validação da revisão.

**Item 8:**

- Trocar o `<link rel="manifest">` dinamicamente nas rotas `/s/:subdominio`, ou servir um manifest por salão com `start_url` apontando para a página do salão.
- Tela neutra para `/cliente` sem rota salva.

**Item 9:**

- Checar o limite antes do upload ao R2.
- Recusar imagens em agendamento cancelado ou concluído.
- Limpar os anexos das reservas expiradas no job de expiração, ou adiar o envio das imagens até a confirmação.

## Critérios de conclusão

- [ ] Não existe mensagem de teste no código.
- [ ] O selo de retorno está separado do título e com a cor de destaque.
- [ ] Nenhuma data aparece no formato `AAAA-MM-DD`.
- [ ] Os passos têm numeração sequencial.
- [ ] O WhatsApp do salão é clicável.
- [ ] Um mês sem vagas mostra orientação.
- [ ] "Meus agendamentos" mostra o status do pagamento.
- [ ] "Meus agendamentos" permite adicionar uma referência.
- [ ] Instalar o app pela página do salão e abrir pelo ícone leva à página do salão.
- [ ] Upload acima do limite, ou em agendamento cancelado, é recusado antes de enviar o arquivo.
