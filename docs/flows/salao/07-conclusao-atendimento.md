# Salão — Conclusão de atendimento e registro do pagamento restante

## Objetivo

Registrar que o atendimento foi realizado, capturar o pagamento do valor restante (quando cliente pagou só sinal), e disparar automações pós-atendimento (lembretes de manutenção, atualização do histórico).

## Passo a passo

1. Salão termina o atendimento (na vida real).
2. No painel, abre o agendamento em questão.
3. Clica em **Concluir atendimento**.
4. Sistema exibe modal de conclusão:
   - Valor total do procedimento
   - Valor já pago
   - **Valor pendente** (destaque; pode ser zero se já pagou tudo)
   - Seletor de método de pagamento do restante (dinheiro, PIX, cartão máquina, etc.)
   - Opção "Não recebeu valor pendente" (com aviso; caso raro — cortesia, erro do salão)

   O **método do sinal** não é exibido: depende do sinal online, que ainda não
   registra pagamento. Enquanto isso, o primeiro pagamento de um agendamento é
   justamente o que esta conclusão grava.
5. Salão seleciona o método e confirma.
6. Sistema:
   - Altera estado do agendamento para `Concluído`.
   - Cria registro de pagamento manual do valor restante com o método escolhido.
   - Se o procedimento tem "período de manutenção sugerido", cria **automaticamente um lembrete** para daqui a X dias (ver [lembretes](./12-lembretes.md)).
7. (Opcional) Salão adiciona anexos internos (fotos do resultado — até 3, apenas o salão vê) — pode ser antes ou depois de concluir.
8. Agendamento sai da agenda "ativa" e vai para o histórico.

## Variações

- **Cliente pagou total no ato do agendamento online:** valor pendente = 0; modal de conclusão só pede confirmação, sem seletor de método.
- **Cliente pagou só sinal:** modal pede método do restante.
- **Cliente é cortesia / salão perdoa o restante:** salão marca "não recebeu valor pendente". A nota explicativa depende do [sistema de notas](./12-lembretes.md) e ainda não existe; por ora a marcação é só a confirmação com aviso.
- **Salão esqueceu de marcar como concluído no mesmo dia:** pode marcar dias depois; sistema aceita, mas relatório reflete data real de conclusão vs. data do agendamento.
- **Salão realiza um procedimento diferente do agendado** (ex.: cliente mudou de ideia): fora do MVP. O agendamento conclui com o procedimento que foi agendado.
- **Múltiplos pagamentos parciais** (cliente pagou 50% do restante em dinheiro e 50% em PIX): fora do MVP; salão registra um método só.

## Regras de negócio

- **Conclusão só disponível para agendamentos em estado `Agendado`.**
- **Concluir agendamento cuja data ainda não chegou é permitido, com aviso explícito** de que o atendimento entra no faturamento do período atual.
- **Sistema NÃO exige conclusão em tempo real** — salão pode marcar minutos ou horas depois (mesmo dias, com penalidade de dado impreciso).
- **NÃO existe estado "em atendimento"** (decidido) — vai direto de `Agendado` para `Concluído`.
- **Duração é apenas referência**; ao concluir, sistema não recalcula nada de agenda.
- **Registro do pagamento é obrigatório** ao concluir (mesmo que seja "não recebeu" — força consciência). "Não recebeu" é uma escolha explícita na tela, não um registro no banco: nenhuma cobrança é criada e a pendência permanece em aberto.
- **Conclusão é terminal.** Não há reversão no MVP; conclusão marcada por engano se corrige via suporte.
- **Editar o procedimento ao concluir está fora do MVP.** Trocar o serviço no dia mudaria preço e sinal já congelados.
- **Lembrete automático de manutenção** só é criado se o procedimento tem "período de manutenção" configurado.
- **Anexos internos** (fotos do resultado): salão pode adicionar até 3 imagens por agendamento; ficam disponíveis apenas para o salão no histórico da cliente.

## Dependências

- **Fluxo de gestão da agenda** (concluir é ação a partir do card do agendamento).
- **Sistema de pagamento manual** (registro do método).
- **Sistema de lembretes** (criação automática se aplicável).
- **Sistema de anexos** (imagens do resultado).
- **Faturamento** (contabiliza atendimento concluído + método de pagamento).

## Casos extremos (edge cases)

- **Salão marca concluído em agendamento futuro** (data ainda não chegou): permitido, com aviso. Regra em "Regras de negócio".
- **Cliente pagou sinal em cartão, valor restante em PIX:** dois registros de pagamento no mesmo agendamento (um automático via gateway, outro manual). Faturamento agrupa por método.
- **Cliente pagou sinal e não veio (foi no-show mas salão marcou como concluído por engano):** sem reversão no MVP; abrir suporte. Estado é terminal.
- **Duração real muito diferente da estimada** (ex.: procedimento previsto 1h durou 3h): sistema não faz nada; próximos agendamentos podem ter conflitado com o próprio salão em atraso.
- **Anexo pesado (imagem grande):** validar tamanho e comprimir antes de subir.
- **Salão marca conclusão de vários agendamentos em lote** (fim do dia): fluxo em lote fora do MVP; um a um.
- **Timezone:** conclusão sempre no horário do salão.
- **Recibo/comprovante para a cliente:** salão emite manualmente hoje; sistema não gera. Ver dúvidas.

## Dúvidas em aberto

- **Salão pode registrar múltiplos pagamentos parciais no valor restante?** MVP: um método só; se cliente pagou em 2 métodos, salão escolhe o predominante.
- **Comprovante/recibo digital para a cliente:** fora do MVP; salão emite manualmente hoje.
- **Confirmação/assinatura da cliente** ao concluir (para casos de disputa): fora do MVP.
