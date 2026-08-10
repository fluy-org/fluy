# Lembretes Internos

## Objetivo

Permitir que o salão registre "to-dos futuros" relacionados a clientes (manutenção, follow-up, retorno, tarefas) — automaticamente após conclusão de atendimento com período de manutenção ou manualmente — sem enviar mensagem automática à cliente. O salão decide quando e como contatar.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

### Lembrete automático

- Criar lembrete automaticamente quando salão marca atendimento como concluído em um procedimento que possui "período de manutenção sugerido" configurado.
- Data alvo = data de conclusão + período de manutenção.
- Texto padrão referenciando o procedimento e a cliente.
- Marcar origem como "automático".

### Nota livre com data (lembrete manual)

- Criar a partir do detalhe de um agendamento OU da ficha da cliente.
- Texto livre + data alvo opcional.
- Se com data alvo: vira lembrete e notifica no dia.
- Se sem data: fica apenas como observação cronológica na ficha da cliente / no agendamento.

### Aba de lembretes

- Listar lembretes ativos com filtros por data (hoje / semana / mês / atrasados), por cliente e por origem (automático / manual).
- Exibir data, cliente, texto e ações rápidas (marcar como concluído, editar, excluir).
- Marcar lembrete como concluído (antes ou depois da data alvo).
- Editar data / texto do lembrete (efeito de "snooze" manual).
- Excluir lembrete.

### Notificação no dia

- Notificar o salão in-app + push PWA no dia alvo via [[notificacoes]].
- Data alvo no passado dispara notificação imediata (aceito).

## Documentos de referência

- fluxos/salao/12-lembretes.md
- fluxos/salao/07-conclusao-atendimento.md (dispara criação automática de lembrete de manutenção)
- fluxos/salao/04-procedimentos.md (campo "período de manutenção sugerido")
- fluxos/salao/11-clientes-historico.md (notas livres também aparecem cronologicamente na ficha)

## Dependências

Depende de:
- [[gestao-procedimentos]] (período de manutenção sugerido)
- [[gestao-agendamentos]] (conclusão é o gatilho da criação automática)
- [[gestao-clientes]] (nota livre criada a partir da ficha)
- [[notificacoes]] (canal para notificar salão no dia alvo)

Usado por:
- [[gestao-clientes]] (notas livres sem data aparecem na ficha)

## Observações

- **Sistema NÃO envia mensagem automática para a cliente** no MVP — apenas notifica o salão.
- Lembretes automáticos são criados apenas na conclusão, não em cancelamento ou no-show.
- Cliente excluída/mesclada tem impacto sobre lembretes associados — política de migração/exclusão a definir.
- Snoozing rápido (1 dia, 1 semana) e recorrência estão fora do MVP — editar a data cobre o caso.
- Templates de mensagem para o salão copiar são úteis, considerar.
- Compartilhamento de lembrete entre usuários fica para o futuro multi-usuário.
