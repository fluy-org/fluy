# Gestão de Disponibilidade

## Objetivo

Permitir que o salão defina quando está aberto para atendimentos, através de um template semanal padrão e overrides por data específica, servindo de insumo para o cálculo de horários oferecidos à cliente.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

- Definir template semanal com, para cada dia da semana: "sem atendimento" ou uma ou mais janelas de trabalho (hora_inicio, hora_fim).
- Criar override para data específica (feriado, folga, horário estendido pontual).
- Reverter override e voltar uma data para o comportamento do template semanal.
- Validar consistência das janelas (hora_inicio < hora_fim, sem sobreposição no mesmo dia).
- Alertar o salão quando alteração de disponibilidade conflita com agendamentos existentes (sem cancelar automaticamente).
- Expor a disponibilidade computada (template + override) como insumo para o cálculo de horários disponíveis.
- Bloquear criação de janelas cruzando meia-noite (fora do MVP).

## Documentos de referência

- fluxos/salao/03-disponibilidade.md
- fluxos/salao/01-onboarding.md (primeira janela é obrigatória no setup mínimo)
- fluxos/cliente/03-criacao-agendamento.md (consumo pela cálculo de horários oferecidos)

## Dependências

Depende de:
- [[conta-e-autenticacao]]
- [[configuracao-do-salao]] (fuso do salão para interpretação das horas)

Usado por:
- [[gestao-agendamentos]] (validação de janela na criação/remarcação; cálculo de horários oferecidos)
- [[agenda-do-dia]]

## Observações

- Ordem de precedência: override por data > template semanal.
- Overrides são armazenados na data mesmo quando iguais ao template, para que possam ser "desativados" explicitamente pelo salão.
- Alterar disponibilidade **não** cancela agendamentos conflitantes; o salão trata caso a caso.
- Recorrência de override (ex.: "toda última sexta é folga") está fora do MVP — cadastro data a data.
- No futuro multi-profissional, disponibilidade passará a ser por profissional; a modelagem deve prever isso.
