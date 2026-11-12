# FLY-004 · Checkout da cliente: tela de pagamento simples e só de pagamento

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Página pública · Checkout |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-002 · Agendar sem pagamento online](./FLY-002-agendamento-sem-pagamento-online.md), [FLY-003 · Reserva pendente e expirada](./FLY-003-reserva-pendente-e-expirada.md), [FLY-005 · Confiabilidade do pagamento](./FLY-005-confiabilidade-do-pagamento-online.md) |

## Descrição

O pagamento não é Pix com QR Code ou copia e cola. É **Pix por Open Finance da Efí**:

1. A cliente informa o CPF e escolhe o banco.
2. Toca em "Preparar pagamento e conferir valores".
3. Toca em "Autorizar no banco", que redireciona a página para o banco.
4. Depois de autorizar, volta pela rota `/retorno-pagamento`.

A tela (`frontend/src/app/features/pagina-cliente/pages/checkout/checkout.page.html`) é longa e mistura assuntos.

### Composição atual da tela

**Card 1** (linhas 46-100): resumo, prazo, preço, sinal e recebedor.

- "Recebedor: Recebedor: X" repetido (linhas 92-94).
- "Prazo da reserva... A validade é conferida pelo servidor." (linhas 70-72), jargão.

**Card 2** (linhas 103-291):

- detalhes do pagamento e alertas;
- modalidade crua ("sinal"/"total", linhas 113-114);
- formulário de modalidade, CPF e banco;
- "Consultar situação" e "Escolher outro horário";
- texto auxiliar e link de WhatsApp;
- mensagem do salão e política de atraso, exibidas mesmo quando são nulas (linhas 143-147). Aparece "Tolerância: X minutos." solto.

**Card 3** (linhas 294-325): envio de imagens de referência, **sempre visível**, inclusive depois do pagamento confirmado.

- As fotos já foram pedidas na revisão (`confirmacao-agendamento.component.html:64-117`), então o upload aparece duas vezes no fluxo.
- Este upload não valida tipo, tamanho nem limite (`checkout.page.ts:352-388`) e não mostra miniaturas.

### Problemas de preenchimento

- **CPF:** `maxlength=11` com placeholder "000.000.000-00" (linhas 208-215). Quem digita com pontos e traço tem o número cortado.
- **Banco:** um `ion-select` em formato de alerta, sem busca, com potencialmente centenas de opções. É ruim de usar no celular.
- **Duas etapas:** "Preparar" e "Autorizar", com termos como "Continuar a mesma tentativa", "Valor do salão", "Tarifa adicional" e "Total a autorizar".
- **Sem contagem regressiva do prazo** (ver [FLY-003](./FLY-003-reserva-pendente-e-expirada.md)).
- **Upload inacessível pelo teclado:** o `input[type=file]` usa `display: none` (`checkout.page.scss:447-449`, `confirmacao-agendamento.component.scss:22`).
- **Estilos inline** espalhados no template.

## Comportamento esperado

A tela de pagamento tem um objetivo só: pagar. A cliente entende em segundos:

- quanto vai pagar agora e quanto paga no salão;
- até quando pode pagar;
- o que vai acontecer quando tocar no botão ("Você será levada ao app do seu banco para autorizar o Pix").

A estrutura sugerida:

1. **Resumo compacto:** procedimento, data e hora, salão.
2. **Valor:** "Pagar agora R$ X" e "No salão R$ Y". A tarifa só aparece discriminada, sem jargão.
3. **Dados:** CPF com máscara e banco com busca.
4. **Botão único:** "Pagar com Pix no meu banco".
5. **Status** depois do retorno do banco: aguardando, confirmado ou falhou, com a próxima ação.

As imagens de referência ficam **fora** do checkout:

- na revisão do agendamento, como já existe;
- no detalhe do agendamento em "Meus agendamentos" ("Adicionar referência").

## O que precisa ser feito

**Separar as imagens do pagamento:**

- Remover o card de referências do checkout.
- Se houver imagens que falharam no envio da revisão, mostrar um aviso discreto com link para o detalhe do agendamento.
- Levar a ação "Adicionar referência" para o detalhe do agendamento em "Meus agendamentos", com a mesma validação (tipo, tamanho, limite) e miniaturas da revisão.

**Etapas e formulário:**

- Unificar "Preparar" e "Autorizar" em uma ação, se a API da Efí permitir. Se não permitir, chamar a preparação automaticamente e deixar só "Autorizar no banco" visível.
- CPF:
  - campo com máscara `000.000.000-00`;
  - `inputmode="numeric"`;
  - aceitar colagem com pontuação;
  - validar os dígitos verificadores antes de enviar.
- Banco:
  - seletor com busca (`interface="modal"` com `ion-searchbar`, ou um componente de lista filtrável);
  - destacar os bancos mais usados no topo.

**Textos e estilo:**

- Reescrever os textos com linguagem de cliente final. Tirar "validade conferida pelo servidor", "mesma tentativa" e "Recebedor:" duplicado.
- Traduzir a modalidade: "Sinal" e "Valor total".
- Exibir a mensagem do salão e a tolerância só com `@if`, como na revisão.
- Remover os estilos inline.
- Esconder o input de arquivo com a técnica `visually-hidden`, mantendo o foco por teclado (vale também para a revisão).

**Status:**

- Depois do pagamento confirmado, a tela mostra só o status final e os botões "Ver meus agendamentos" e "Adicionar ao calendário".

## Critérios de conclusão

- [ ] O checkout não tem seção de envio de imagens. As imagens podem ser adicionadas pelo detalhe do agendamento.
- [ ] A cliente cola ou digita um CPF com pontuação e o valor fica correto.
- [ ] A cliente encontra o banco digitando parte do nome.
- [ ] Há no máximo um botão de ação principal visível por estado da tela.
- [ ] Nenhum texto técnico ou repetido ("Recebedor: Recebedor", "sinal" cru, "servidor").
- [ ] Mensagem e tolerância vazias não aparecem.
- [ ] O input de arquivo é alcançável por teclado.
