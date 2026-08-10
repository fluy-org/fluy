# Fluxos do Fluy

Este diretório contém a documentação funcional dos fluxos do sistema, organizados por tipo de usuário.

- [`cliente/`](./cliente) — fluxos da cliente final (quem agenda)
- [`salao/`](./salao) — fluxos do salão (quem gerencia)
- [`PENDENCIAS.md`](./PENDENCIAS.md) — decisões adiadas e dúvidas em aberto (checklist antes de modelar/implementar)

Cada fluxo está em um arquivo Markdown separado seguindo a estrutura:

1. **Objetivo** — o que o fluxo resolve
2. **Passo a passo** — sequência principal (caminho feliz)
3. **Variações** — sucesso alternativo, erro, cancelamento, edição
4. **Regras de negócio** — restrições e políticas aplicáveis
5. **Dependências** — outros fluxos ou sistemas necessários
6. **Casos extremos (edge cases)** — situações limite que precisam ser tratadas
7. **Dúvidas em aberto** — decisões ainda pendentes

## Contexto do produto

- **Fluy** é um SaaS multi-tenant para salões de beleza
- **Plataforma:** web, mobile-first, PWA
- **MVP:** 1 profissional por salão, mas modelagem preparada para multi
- **Referência:** ColavoSalon (concorrente); objetivo é ser mais simples e focado no fluxo real do salão

## Índice de fluxos

### Cliente
- [Primeiro acesso e identificação](./cliente/01-primeiro-acesso.md)
- [Retorno (cliente reconhecida)](./cliente/02-retorno.md)
- [Criação de agendamento](./cliente/03-criacao-agendamento.md)
- [Cancelamento pela cliente](./cliente/04-cancelamento.md)
- [Recebimento de alteração feita pelo salão](./cliente/05-notificacao-alteracao.md)

### Salão
- [Onboarding e setup inicial](./salao/01-onboarding.md)
- [Login](./salao/02-login.md)
- [Configuração de disponibilidade](./salao/03-disponibilidade.md)
- [Cadastro e gestão de procedimentos](./salao/04-procedimentos.md)
- [Agendamento manual pelo salão](./salao/05-agendamento-manual.md)
- [Gestão da agenda do dia](./salao/06-agenda-dia.md)
- [Conclusão de atendimento e pagamento restante](./salao/07-conclusao-atendimento.md)
- [Cancelamento pelo salão](./salao/08-cancelamento.md)
- [Remarcação pelo salão](./salao/09-remarcacao.md)
- [Marcação de no-show](./salao/10-no-show.md)
- [Gestão de clientes e histórico](./salao/11-clientes-historico.md)
- [Lembretes internos](./salao/12-lembretes.md)
- [Faturamento e fechamento de período](./salao/13-faturamento.md)
