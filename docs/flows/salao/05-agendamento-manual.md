# Salão — Agendamento manual pelo salão

## Objetivo

Permitir que o salão registre agendamentos criados fora do fluxo digital (cliente ligou, veio pessoalmente, encaixe de última hora), sem obrigar a passar pelo pagamento online.

## Passo a passo

1. Salão acessa a agenda (visão do dia/semana) e clica em "Novo agendamento" (ou seleciona um horário vago).
2. Sistema pede:
   - **Cliente** — buscar cadastro existente por nome/WhatsApp OU criar novo cadastro (nome + WhatsApp).
   - **Procedimento** — selecionar do catálogo (mostra ativos + inativos com aviso, para casos de encaixe pontual).
   - **Data e horário** — pré-preenchido se veio de um slot vago; editável.
   - **Sinal** — opção "sem sinal", "sinal registrado como pago" (ex.: cliente pagou em dinheiro por antecipação), ou "gerar link de sinal para cliente" (usa o gateway normal).
   - **Observações** (opcional).
3. Sistema valida disponibilidade (janela + conflitos).
4. Salão confirma.
5. Sistema cria o agendamento diretamente em estado `Agendado` (se sinal registrado como pago OU sem sinal) OU `Reservado` (se optou por gerar link de sinal e aguardar pagamento).
6. Sistema notifica a cliente (via push PWA, se tiver ativado, OU aparece no próximo acesso dela).
7. Slot ocupado; salão volta à agenda.

## Variações

- **Cliente existente + sem sinal:** agendamento cai direto em `Agendado`.
- **Cliente existente + sinal já pago em dinheiro:** agendamento em `Agendado`; registro de pagamento manual criado.
- **Cliente existente + gerar link:** agendamento em `Reservado`; link gerado; se cliente pagar no prazo, promove para `Agendado`.
- **Cliente nova:** cadastro criado; agendamento associado ao novo cadastro.
- **Horário conflita com outro agendamento:** sistema bloqueia (mostra o conflito).
- **Horário fora de janela:** sistema alerta mas pode permitir override (salão está fazendo encaixe fora do expediente conscientemente). Ver dúvidas em aberto.
- **Salão desiste antes de confirmar:** nada persiste.

## Regras de negócio

- **Salão pode pular a exigência de sinal** ao criar manualmente. É a principal diferença do fluxo da cliente.
- **Se salão marca "sinal pago em dinheiro":** cria-se um registro de pagamento manual (método = dinheiro) no valor do sinal, com estado "confirmado".
- **Se salão marca "sem sinal":** valor pendente = valor total do procedimento; a ser cobrado no dia via [conclusão de atendimento](./07-conclusao-atendimento.md).
- **Se salão gera link de sinal para a cliente:** funciona como o fluxo digital normal — reserva por X min, cliente paga, vira `Agendado`.
- **Todo agendamento manual segue as mesmas regras de disponibilidade** (não pode conflitar, não pode ultrapassar janela) — exceto se salão escolher override explícito.
- Cliente deve receber a mesma **notificação de novo agendamento** que receberia no fluxo digital.

## Dependências

- **Cadastro de clientes** (busca ou criação).
- **Catálogo de procedimentos** (com aceitação de inativos em casos manuais).
- **Configuração de disponibilidade** para validar conflitos.
- **Sistema de pagamento manual** (registro de "pago em dinheiro / pix pessoal / cartão máquina").
- **Sistema de notificação para a cliente**.

## Casos extremos (edge cases)

- **Cliente sem WhatsApp válido** (encaixe presencial rápido, salão só sabe o nome): permitir criar com WhatsApp opcional ou placeholder? MVP: exigir sempre (WhatsApp é a chave). Se salão realmente não tem, orienta a pegar.
- **Duas Marias com WhatsApps diferentes:** cadastros separados — não há confusão.
- **Salão cria agendamento no passado:** permitir com aviso e confirmação explícita; cria em `Agendado`. O registro retroativo já concluído fica para um fluxo específico de migração, fora desta fatia.
- **Salão cria agendamento em horário já em `Reservado` por cliente online:** conflito; sistema bloqueia.
- **Salão cria agendamento com sinal manual acima do preço:** validação bloqueia.
- **Cliente que a salão cria manualmente já existia no sistema com WhatsApp igual:** sistema oferece reutilizar cadastro em vez de duplicar.
- **Reserva expirando enquanto salão está criando** (concorrência entre online e manual): quem chegar ao servidor primeiro leva.
- **Salão desativa procedimento e depois cria agendamento manual com esse procedimento:** permitido (encaixe pontual); sistema exibe alerta.

## Dúvidas em aberto

- **Override de janela** (agendar fora do horário de trabalho): permitir com aviso? Bloquear? MVP: recomendo permitir com aviso ("está fora do seu horário; confirmar?").
- **Registro pós-atendimento em lote** (migração de agenda antiga): fluxo específico para cadastrar N atendimentos passados de uma vez? Fora do MVP.
- **Salão pode marcar agendamento manual como "não avisar a cliente"** (ex.: encaixe combinado ao vivo, cliente já sabe)? Considerar checkbox opcional.
- **Bloco de agenda "não-atendimento" pelo salão** (ex.: "das 15 às 16 estou em reunião"): tratar como agendamento sem cliente? Como override na janela? MVP: usar override de janela (adicionar break temporário na disponibilidade); reavaliar se surgir demanda.
