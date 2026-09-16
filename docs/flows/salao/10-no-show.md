# Salão — Marcação de no-show

## Objetivo

Registrar que a cliente não compareceu ao agendamento dentro do horário + tolerância, para efeitos de histórico da cliente, faturamento (sinal retido) e métrica de no-shows.

## Passo a passo

1. Salão espera até `horario_agendado + tolerancia` sem a cliente aparecer.
2. Abre o agendamento em `Agendado`.
3. Clica em **Marcar no-show**.
4. Sistema exibe confirmação: "A cliente [Nome] não compareceu. Sinal (R$ X) será retido. Confirmar?"
5. Salão confirma.
6. Sistema:
   - Altera estado do agendamento para `No-show`.
   - Sinal permanece com o salão (sem reembolso).
   - Marca o agendamento no histórico da cliente como no-show (útil para o salão saber recorrência).
7. Card do agendamento sai da agenda ativa e vai para histórico.

## Variações

- **Cliente aparece atrasada dentro da tolerância:** salão NÃO marca no-show; segue para conclusão normal.
- **Cliente aparece muito atrasada, após já ter marcado no-show:** salão precisa reverter? Fora do MVP — ver dúvidas.
- **Cliente sem sinal (agendamento manual do salão sem sinal):** no-show ainda registra, mas sem valor retido.
- **Salão esquece de marcar no-show no dia:** pode marcar depois; sistema aceita.

## Regras de negócio

- **Marcar no-show é permitido a partir de `hora_agendada`.** Enquanto `hora_agendada + tolerância` não expirar, a ação é liberada **com aviso explícito** de que a tolerância ainda não passou. Antes de `hora_agendada` continua bloqueado.
- **Toleraância é global do salão** — mesmo valor para todos os procedimentos.
- **Marcação é manual** — sistema NÃO marca automaticamente (evita falsos positivos).
- **Sinal é retido em qualquer no-show** (independe de motivo).
- **Estado no-show é terminal** — mesma regra de cancelamento/conclusão: irreversível no MVP.
- **Registro do no-show entra no faturamento** na seção "sinais retidos por cancelamento/no-show".
- **Não gera notificação para a cliente** por padrão — o salão decide se contata (via WhatsApp pessoal, por exemplo).

## Dependências

- **Configuração da tolerância** (definida pelo salão).
- **Sistema de gestão de agenda.**
- **Faturamento** (contabiliza sinais retidos).
- **Histórico da cliente** (registra o no-show no perfil).

## Casos extremos (edge cases)

- **Salão marca no-show antes de expirar tolerância:** permitido, com aviso de que o prazo ainda não passou.
- **Cliente aparece após ser marcada como no-show:** salão precisa reverter ou atender mesmo assim? MVP: registro fica; salão atende por gentileza mas não altera o sistema. Ou abre suporte.
- **Cliente cancela ao mesmo tempo que salão marca no-show (race):** o que chegar primeiro vence.
- **Salão marca no-show para agendamento futuro (data ainda não chegou):** proibido.
- **Cliente com múltiplos no-shows recorrentes:** salão vê no histórico dela; MVP não bloqueia novos agendamentos automaticamente. Ver dúvidas.
- **Sinal já foi reembolsado** por algum motivo (raro): não deveria acontecer, mas se acontecer, não retém de novo.

## Dúvidas em aberto

- ~~**Marcar no-show antes da tolerância**~~ — decidido: permitir com aviso. Regra movida para "Regras de negócio".
- **Reversão de no-show:** cliente apareceu depois; salão quer atender e marcar como concluído. Não previsto no MVP. Se necessário, abrir suporte / admin.
- **Bloqueio de clientes com N no-shows:** ex.: cliente com 3 no-shows não pode agendar de novo sem contato. Fora do MVP; interessante para v2.
- **Notificar a cliente sobre o no-show:** MVP não envia. Vale considerar mensagem automática ("sentimos sua falta, gostaria de remarcar?") — mas depende de canal (WhatsApp API).
- **Métrica global de no-shows para o salão** (% do total): interessante para relatórios; fora do MVP mas fácil de adicionar.
