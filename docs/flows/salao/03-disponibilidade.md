# Salão — Configuração de disponibilidade

## Objetivo

Permitir que o salão defina quando está disponível para atendimentos, através de um template semanal padrão e overrides por data específica (feriados, folgas, dias com horário diferente).

## Passo a passo

### Configurar template semanal

1. Salão acessa "Disponibilidade" no painel.
2. Sistema exibe os 7 dias da semana.
3. Para cada dia, salão define:
   - **Sem atendimento** (dia fechado), OU
   - Uma ou mais **janelas de trabalho** (ex.: "09:00-12:00" e "14:00-18:00")
4. Salão salva.

### Configurar override para data específica

1. Salão seleciona uma data no calendário.
2. Sistema mostra a configuração atual da data (template padrão OU override existente).
3. Salão pode:
   - **Marcar como fechado** (feriado, folga).
   - **Definir janelas específicas** (ex.: "sábado com horário estendido 09:00-20:00" quando o padrão de sábado é 09:00-14:00).
   - **Reverter para o padrão** (remove o override).
4. Salão salva.

## Variações

- **Configuração inicial** (durante onboarding): salão define pelo menos o template semanal.
- **Ajuste rotineiro:** salão altera o template para mudança permanente (ex.: passa a abrir também aos domingos).
- **Bloqueio pontual:** salão marca 1 dia como fechado (feriado, viagem).
- **Horário estendido pontual:** salão adiciona janela extra em 1 dia.
- **Salão altera template semanal e há agendamentos no horário removido:** sistema exibe alerta com a lista de conflitos e salão decide caso a caso o que fazer (manter, remarcar, cancelar).

## Regras de negócio

- **Template semanal + overrides por data.** Modelo único, sem conceito separado de "bloqueio".
- **Ordem de precedência:** override por data > template semanal.
- **Overrides ficam registrados na data**, mesmo quando iguais ao template (para que salão possa "desativá-los" e voltar ao padrão).
- **Não há limite de janelas por dia** — salão pode definir 3, 4 janelas se quiser (embora prática comum sejam 1 ou 2).
- **Uma janela é definida por hora_inicio e hora_fim.** Não pode ter janelas sobrepostas no mesmo dia.
- **Alterar disponibilidade NÃO cancela automaticamente agendamentos conflitantes** — sistema avisa e salão decide.
- **Cálculo de disponibilidade para agendamento** usa: janelas do dia (via template + override) − agendamentos existentes.

## Dependências

- **Onboarding do salão** — configuração inicial acontece aqui.
- **Cálculo de horários disponíveis** para clientes (fluxo de criação de agendamento).
- **Notificação/aviso de conflito** ao alterar janelas com agendamentos existentes.

## Casos extremos (edge cases)

- **Salão define janela com hora_inicio ≥ hora_fim:** validação bloqueia.
- **Salão define janelas sobrepostas no mesmo dia:** validação bloqueia (ex.: "10-14" e "13-17" gera conflito).
- **Salão define janela cruzando meia-noite** (ex.: "22:00-02:00"): fora do MVP — validação bloqueia; sistema não suporta janelas noturnas cruzando dias.
- **Override no passado:** permitir? Sim, mas não altera agendamentos passados; só afeta relatório de "estava aberto/fechado".
- **Salão configura template todo vazio ("sem atendimento" em todos os dias):** aceito, mas URL pública mostra "sem horários disponíveis".
- **Fuso horário:** todas as horas são interpretadas no fuso do salão (armazenamento em UTC — ver [decisões](../../memory)).
- **Horário de verão:** decisão adiada — MVP assume que Brasil não tem horário de verão (verdade em 2026).
- **Salão altera template durante uma reserva temporária de cliente em andamento:** ver casos extremos do fluxo de agendamento.

## Dúvidas em aberto

- **Recorrência de override** (ex.: "toda última sexta do mês é folga"): fora do MVP; salão precisa cadastrar data a data.
- **Copiar configuração de um dia para outro** (ex.: "aplicar configuração de terça em todas as quartas"): UX que ajuda muito, mas não decidido no MVP.
- **Antecedência mínima para alterar disponibilidade:** salão pode fechar amanhã com clientes já agendados; regra? MVP: permite, mas alerta conflitos.
- **Configuração de disponibilidade por profissional:** modelagem já prevê multi-profissional (ver [contexto do produto](../README.md)); MVP tem apenas 1 profissional por salão, então template é do salão. Quando multi, será por profissional.
