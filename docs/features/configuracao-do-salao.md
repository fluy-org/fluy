# Configuração do Salão

## Objetivo

Manter os parâmetros operacionais que moldam o comportamento do sistema para o salão específico — regras de reserva, tolerâncias, antecedências, mensagens e informações apresentadas à cliente — separando estas configurações da disponibilidade e do catálogo (que têm features próprias).

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

- Definir informações públicas do salão (nome, contato/WhatsApp, endereço).
- Gerenciar subdomínio público (`nome-do-salao.fluy.app`).
- Configurar granularidade dos horários de início oferecidos à cliente (default 30min).
- Configurar prazo de reserva sem pagamento (tempo que um slot fica `Reservado` aguardando confirmação de pagamento; default 15min).
- Configurar tolerância global de atraso (usada como gate para marcar no-show; default 15min).
- Configurar antecedência mínima para agendamento pela cliente (default 2h).
- Configurar antecedência máxima para agendamento pela cliente (default 60 dias).
- Configurar mensagem personalizada exibida na confirmação do agendamento.
- Configurar política/aviso de atraso apresentado à cliente.
- Aceitar defaults sensatos ao final do onboarding, permitindo edição posterior a qualquer momento.

## Regras de edição

- A edição operacional cobre granularidade, prazo de reserva, tolerância de atraso, antecedências e os textos de confirmação e política de atraso.
- Cada atualização altera ao menos um campo. Os valores numéricos são inteiros positivos.
- Os textos não aceitam valor em branco; `null` remove o texto e a omissão do campo preserva o valor atual.
- A antecedência mínima em horas não pode exceder a antecedência máxima em dias convertida para horas.

## Documentos de referência

- fluxos/salao/01-onboarding.md (defaults iniciais dos parâmetros)
- fluxos/cliente/03-criacao-agendamento.md (consumo dos parâmetros no cálculo de disponibilidade, reserva temporária e tela de confirmação)
- fluxos/salao/10-no-show.md (uso da tolerância global)
- fluxos/salao/03-disponibilidade.md (interpretação de horários no fuso do salão)

## Dependências

Depende de:
- [[conta-e-autenticacao]] (setup inicial acontece no onboarding)

Usado por:
- [[gestao-agendamentos]]
- [[gestao-disponibilidade]]
- [[agenda-do-dia]]
- [[pagamentos]]
- [[notificacoes]]

## Observações

- Todos os horários são interpretados no fuso do salão (armazenamento em UTC).
- Horário de verão é assumido inexistente para o MVP (verdade em 2026).
- Tolerância é global no MVP — não varia por procedimento.
- No futuro multi-profissional, alguns parâmetros podem passar a ser por profissional.
- Informações pré-procedimento são configuradas por `procedimento`, não globalmente pelo salão.
