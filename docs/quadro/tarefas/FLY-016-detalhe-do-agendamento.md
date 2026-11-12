# FLY-016 · Detalhe do agendamento: reorganizar a tela e deixar as ações em primeiro plano

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Painel do salão · Detalhe do agendamento e modais de ação |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-020 · Feedback das ações](./FLY-020-feedback-das-acoes.md), [FLY-015 · Novo agendamento](./FLY-015-novo-agendamento-pelo-salao.md) (remarcação) |

## Descrição

### Tudo empilhado na vertical

A tela (`frontend/src/app/features/salao/agenda/pages/agendamento-detalhe/agendamento-detalhe.page.html:38-106` e `components/detalhe-agendamento/detalhe-agendamento.component.html:1-59`) mostra, nesta ordem:

1. Barra "Agendamento" com o botão voltar.
2. Card de destaque: data por extenso, hora grande, selo de estado, "1h de atendimento" e "Remarcado N vezes".
3. **CLIENTE**: nome como link sublinhado e WhatsApp como texto, sem link.
4. **PROCEDIMENTO**: nome e a **duração de novo**.
5. **VALORES**: Total, Sinal, Pago, linha divisória e Pendente.
6. **"Imagens de referência"**: card sempre visível, mesmo vazio ("Nenhuma imagem de referência enviada.").
7. **"Anexos internos"**: card com o contador 0/3 e o botão Adicionar.
8. **"Ações"**: avisos, Concluir atendimento, Remarcar, linha divisória, Marcar no-show e Cancelar agendamento.
9. **Lembretes**: lista ou "Nenhum lembrete ativo.", e o botão "Adicionar lembrete".
10. **Notas**: lista ou "Nenhuma nota registrada.", o campo de texto e "Adicionar nota".

**As ações, que são o motivo de abrir a tela, só aparecem depois de dois cards de imagens.**

### Defeitos visuais

- **Bloco "Ações" sem estilo.** Ele usa as classes `bloco`, `bloco__titulo` e `bloco__apoio`, que só existem no SCSS encapsulado do componente filho (`detalhe-agendamento.component.scss:148-174`).
  - Na página, as classes ficam sem efeito.
  - O título "Ações" sai com o h2 padrão do Ionic, maior e diferente de "CLIENTE" e "VALORES".
  - O bloco fica sem margem.
- **Cards de imagens colados.**
  - O card de referências só tem `margin-top` (`secao-referencias.component.scss`, `.referencias`).
  - `.anexos` não tem margem nenhuma.
  - Os dois cards ficam colados.
- **Cabeçalho fora do padrão.** Usa `ion-toolbar` direto (`agendamento-detalhe.page.html:1-8`) em vez do `app-header` das outras telas.
- **Voltar da ficha não retorna ao agendamento.** O link para a ficha usa `[replaceUrl]="true"` (`detalhe-agendamento.component.html:24`).

### Estados encerrados e reservados sem explicação

- **Frase de jargão.** Nos estados terminais (concluído, cancelado, falta), o bloco de ações diz só "Este estado não permite nenhuma ação." (`page.html:89`).
- **Desfecho invisível.** O schema do detalhe (`shared/schema/src/agendamento/agendamento.schema.ts:260-269`) não traz:
  - motivo do cancelamento;
  - quem cancelou;
  - data da conclusão;
  - forma de pagamento.

  A tela não tem como mostrar o desfecho.
- **Reservado sem contexto:**
  - mostra a mesma frase;
  - não explica que se espera o pagamento do sinal;
  - não mostra "expira em X min", que a doc `docs/flows/salao/06-agenda-dia.md` pede. O campo `expira_em` existe na tabela, mas não trafega.
- **"Pendente" fora de contexto.** Em agendamento cancelado ou com falta, o cálculo `valor_pendente = total − pago` vale em qualquer estado (`backend/src/modules/agendamento/agendamento-utils.ts:70-84`). A tela mostra "Pendente" para um atendimento que nunca vai acontecer.

### Modais de ação

- **Cancelamento não fala do dinheiro.** `formulario-cancelamento.component.html:6` só avisa que a cliente será notificada.
  - Pelo faturamento (`faturamento-utils.ts:159`), o valor pago num cancelamento feito pelo salão vira "Cancelamento pelo salão sem reembolso", ou seja, fica retido.
  - O modal não avisa.
  - A doc `docs/flows/salao/08-cancelamento.md` deixa a decisão sobre o sinal em aberto.
- **Conclusão longa e vaga:**
  - o modal inclui a seção inteira de anexos entre o resumo de valores e a forma de pagamento (`formulario-conclusao.component.html:30-33`);
  - o seletor de forma de pagamento não diz qual valor será registrado.
- **Remover anexo sem confirmação:**
  - a lixeira vermelha de cada miniatura apaga direto (`secao-anexos.component.html:74-84`);
  - notas e lembretes pedem confirmação.
- **Imagens sem ampliação.** As imagens não abrem em tamanho maior (`secao-referencias.component.html:17-20`, `secao-anexos.component.html:70-73`).

## Comportamento esperado

### Topo: um único card de resumo

- hora, data e selo de estado;
- cliente, com botões "WhatsApp" (wa.me) e "Ver ficha";
- procedimento e duração, uma vez só;
- valores resumidos ("R$ 50 a receber de R$ 80"), que expandem para Total, Sinal, Pago e Pendente.

### Ações sempre visíveis

- Barra fixa no rodapé com a ação principal do estado: "Concluir atendimento" quando agendado.
- "Mais ações" (action sheet) com Remarcar, "Não compareceu" e Cancelar.

### Conteúdo secundário organizado

- Abas ou seções recolhíveis com contagem: **Fotos (2)** e **Notas e lembretes (3)**.
- O card de referências vazio não aparece.

### Estados terminais e reservado

- **Encerrado:** em vez de ações, um card de desfecho. Exemplos:
  - "Concluído em 19/11 às 10:40 · R$ 50 em PIX";
  - "Cancelado pelo salão: motivo X";
  - "Cliente não compareceu · R$ 20 de sinal retido".
- **Reservado:** "Aguardando a cliente pagar o sinal · expira em 12 min".
- **Valores em cancelado ou falta:** nunca aparece "A receber".

### Modais

- **Cancelar:**
  > "O cancelamento não pode ser desfeito. O valor já pago (R$ X) fica registrado como retido; a devolução, se houver, é combinada com a cliente."
- **Concluir:**
  - pergunta "Como recebeu os R$ 50 restantes?";
  - anexos opcionais e recolhidos.
- **Remover anexo:** pede confirmação.
- **Imagens:** abrem em tela cheia.

## O que precisa ser feito

### Backend e schema

- Incluir no response do detalhe:
  - `expira_em`;
  - o desfecho: motivo e autor do cancelamento, data da conclusão e forma de pagamento registrada.

  Agrupar em objeto aninhado quando houver dois ou mais campos, conforme a regra do `CLAUDE.md`.
- Revisar `valor_pendente` nos estados cancelado e falta: zerar, ou expor um campo de "retido" e deixar a decisão de exibição ao front. Documentar em `docs/domain/agendamento.md`.

### Frontend: layout

- Reorganizar `agendamento-detalhe.page.html` e `detalhe-agendamento.component.html` conforme acima:
  - card de resumo único;
  - ações no `ion-footer`, com action sheet;
  - abas ou acordeões para fotos e notas e lembretes.
- Mover os estilos de bloco para o lugar certo, ou para `global.scss` se forem reutilizados.
- Corrigir o espaçamento entre os cards.
- Usar `app-header`.
- Remover o `replaceUrl` do link para a ficha.

### Frontend: estados e modais

- Card de desfecho por estado.
- Texto do reservado com a contagem do prazo.
- Esconder "Pendente" e "A receber" em cancelado e falta. O mesmo vale para o card da agenda, ver [FLY-017](./FLY-017-agenda-do-dia-e-avisos.md).
- **Cancelamento:**
  - novo texto, considerando o valor pago;
  - atualizar `docs/flows/salao/08-cancelamento.md` com a decisão sobre o sinal.
- **Conclusão:**
  - valor no rótulo da forma de pagamento;
  - anexos recolhidos.
- **Imagens e anexos:**
  - confirmação ao remover anexo;
  - visualização ampliada das imagens (modal com a imagem inteira).

### Retorno das ações

Ver [FLY-020](./FLY-020-feedback-das-acoes.md).

## Critérios de conclusão

- [ ] No celular, a ação principal está visível sem rolar, em qualquer estado.
- [ ] A duração aparece uma única vez.
- [ ] O WhatsApp da cliente abre a conversa.
- [ ] O card de referências vazio não aparece.
- [ ] Os blocos têm espaçamento uniforme.
- [ ] Agendamentos encerrados mostram o desfecho, nunca "Este estado não permite nenhuma ação."
- [ ] Agendamentos reservados mostram o prazo do pagamento.
- [ ] Cancelados e faltas não mostram valor "a receber".
- [ ] O modal de cancelamento explica o que acontece com o valor pago.
- [ ] Remover anexo pede confirmação.
- [ ] As imagens abrem ampliadas.
- [ ] Voltar da ficha da cliente retorna ao agendamento.
