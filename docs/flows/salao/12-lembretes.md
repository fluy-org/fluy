# Salão — Lembretes internos

## Objetivo

Permitir que o salão registre "to-dos futuros" relacionados a clientes (manutenção, follow-up, retorno, tarefas específicas), tanto de forma automática (baseada em procedimento) quanto manual, sem enviar mensagem automática à cliente — o salão decide quando e como contatar.

## Passo a passo (lembrete automático — manutenção)

1. Salão configurou "período de manutenção sugerido" (X dias) em um procedimento.
2. Cliente realiza o procedimento; salão marca como [concluído](./07-conclusao-atendimento.md).
3. Sistema cria automaticamente um lembrete com:
   - Data alvo = data de conclusão + X dias
   - Cliente vinculada
   - Texto padrão ("Retorno de manutenção — [nome do procedimento]")
   - Origem = automático
4. Lembrete aparece na aba de lembretes do salão.
5. No dia alvo, sistema notifica o salão (in-app + push PWA).
6. Salão decide como contatar a cliente (WhatsApp pessoal, ligação, etc.).

## Passo a passo (nota livre com data — lembrete manual)

1. Salão acessa um agendamento OU a ficha da cliente.
2. Clica em "Adicionar nota".
3. Preenche:
   - Texto livre
   - Data alvo (opcional; se preencher, vira lembrete)
4. Sistema salva.
5. Se tem data alvo: no dia, sistema notifica o salão.
6. Se não tem data: só fica como observação no histórico da cliente / no agendamento.

## Passo a passo (aba de lembretes)

1. Salão acessa aba "Lembretes".
2. Sistema exibe lista de lembretes ativos, filtrável:
   - Por data (hoje, esta semana, este mês, atrasados)
   - Por cliente
   - Por origem (automático, manual)
3. Cada lembrete mostra: data, cliente, texto, ação rápida (marcar como concluído, editar, excluir).

## Variações

- **Lembrete automático criado ao concluir atendimento:** aparece na aba de lembretes; notifica no dia.
- **Nota livre com data:** vira lembrete; notifica no dia.
- **Nota livre sem data:** só fica como observação (não notifica).
- **Salão edita/desativa lembrete automático** logo após criação: OK; salão pode alterar.
- **Salão marca lembrete como concluído** manualmente antes da data: OK.
- **Salão marca lembrete como concluído** depois do dia alvo: OK; útil se contatou a cliente com atraso.
- **Salão apaga lembrete:** OK; ação silenciosa.

## Regras de negócio

- **Sistema NÃO envia mensagem automática para a cliente** no MVP — apenas notifica o salão.
- **Lembrete automático de manutenção** só é criado se o procedimento tem "período de manutenção" configurado.
- **Notas livres podem ser criadas em dois pontos:** dentro de um agendamento OU direto na ficha da cliente.
- **Data alvo é opcional** — se ausente, nota vira apenas observação sem notificação.
- **Lembretes têm estado ativo/concluído.** Salão pode marcar como concluído para tirar da lista.
- **Aba de lembretes é separada da agenda** — não mistura atendimentos com to-dos internos.

## Dependências

- **Cadastro de procedimentos** (para "período de manutenção sugerido").
- **Fluxo de conclusão de atendimento** (dispara criação automática).
- **Ficha da cliente / detalhe do agendamento** (para criar notas livres).
- **Sistema de notificação para o salão** (in-app + push PWA).

## Casos extremos (edge cases)

- **Procedimento com "período de manutenção" e cliente já cancelou o agendamento:** nenhum lembrete criado (só cria ao concluir, não ao cancelar/no-show).
- **Data alvo no passado** (salão preenche por engano ou pra "lembrar agora"): aceito; notifica imediatamente.
- **Cliente é excluída/mesclada:** lembretes associados devem migrar ou ser excluídos junto (política a definir).
- **Múltiplos lembretes automáticos** (cliente fez 3 procedimentos com manutenção): cria 3 lembretes; sem consolidação automática. Salão gerencia.
- **Salão desativa procedimento após lembrete automático criado:** lembrete permanece válido.
- **Notificação chega em dia não útil** (fim de semana, feriado): sistema notifica no dia alvo mesmo assim; salão trata.
- **Data alvo muito distante** (ex.: 2 anos): aceito; lembrete fica na lista.

## Dúvidas em aberto

- **Enviar mensagem automática para a cliente** (via WhatsApp API) no futuro: previsto na v2 se demanda aparecer.
- **Snoozing / adiar lembrete:** MVP não tem; salão pode editar a data. Feature de snooze rápido (1 dia, 1 semana) fora do MVP.
- **Recorrência de lembrete** (ex.: "todo mês lembrar"): fora do MVP.
- **Templates de mensagem** para o salão copiar (ex.: "Olá {nome}, é hora da sua manutenção!"): útil, considerar.
- **Compartilhar lembrete com outro usuário** (quando multi-usuário): fora do MVP.
