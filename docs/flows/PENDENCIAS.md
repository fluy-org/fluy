# Pendências e decisões adiadas

Este documento consolida as decisões que foram **explicitamente adiadas** durante o desenho dos fluxos, bem como as principais dúvidas em aberto que aparecem espalhadas pelos MDs de cada fluxo. Serve como checklist antes de partir para modelagem/implementação de cada área.

Última atualização: 2026-09-14

---

## 1. Pagamento — gateway e infraestrutura

**Status:** adiado explicitamente pelo usuário.

- **Qual gateway usar?** Em avaliação: Woovi (só PIX) ou Asaas (PIX + cartão). Nenhum cravado.
- **Titular da conta de recebimento:** salão recebe direto (conecta sua conta no gateway) OU Fluy recebe e repassa via split? Impacto grande em regulação, risco de chargeback, complexidade de onboarding do salão.
- **Métodos aceitos:** dependem do gateway.
- **Política de reembolso** em cancelamento pelo salão: automático via gateway ou manual? Decisão travada pelo gateway não estar escolhido.

**Onde impacta nos fluxos:**
- [cliente/03-criacao-agendamento.md](./cliente/03-criacao-agendamento.md)
- [salao/08-cancelamento.md](./salao/08-cancelamento.md)
- [salao/05-agendamento-manual.md](./salao/05-agendamento-manual.md)

---

## 2. Cobrança do SaaS (monetização do Fluy)

**Status:** adiado. MVP sem cobrança, foco em validar função primeiro.

- Modelo: assinatura mensal, freemium, percentual sobre transações, outro?
- Valor de referência? (concorrente ColavoSalon = R$ 26,99/mês)
- Trial gratuito? Duração?
- Dados fiscais do salão (CNPJ, razão social) — coletar no onboarding ou depois?

**Onde impacta:** [salao/01-onboarding.md](./salao/01-onboarding.md)

---

## 3. LGPD e privacidade

**Status:** não coberto no MVP; precisa entrar cedo.

- **Consentimento** no primeiro acesso da cliente (aviso de política de privacidade).
- **Direito à exclusão** da cliente (LGPD art. 18): fluxo para cliente/salão apagar cadastro.
- **Retenção de dados** de agendamentos após exclusão (necessidade legal x direito da cliente).
- **Exportação (portabilidade)** dos dados da cliente.
- **Log de acessos e auditoria** — o que o salão vê, o que o Fluy processa.

**Onde impacta:**
- [cliente/01-primeiro-acesso.md](./cliente/01-primeiro-acesso.md)
- [salao/11-clientes-historico.md](./salao/11-clientes-historico.md)

---

## 4. Multi-usuário no salão (multi-profissional futuro)

**Status:** modelagem preparada, UI adiada. MVP = 1 usuário por salão.

- Sistema de papéis (dono, funcionário, admin?).
- Permissões por papel (quem pode faturar, quem pode alterar catálogo, etc.).
- Convite/gestão de usuários (adicionar/remover funcionário).
- Logs de auditoria (o que foi feito por quem).
- Agenda por profissional (cada um com sua disponibilidade e agendamentos).
- Filtro por profissional na agenda e no faturamento.
- Comissões (quando faturamento multi-profissional).

**Onde impacta:**
- [salao/03-disponibilidade.md](./salao/03-disponibilidade.md) — disponibilidade por profissional
- [salao/06-agenda-dia.md](./salao/06-agenda-dia.md) — filtro
- [salao/13-faturamento.md](./salao/13-faturamento.md) — coluna por profissional
- Modelagem geral já deve prever

---

## 5. Recuperação de acesso da cliente (perdeu UUID)

**Status:** não coberto no MVP; cliente que limpou cookies e quer cancelar/ver agendamento precisa falar com o salão via WhatsApp.

- Vale ter fluxo "identificar por código no WhatsApp" para recuperar acesso? Depende de canal WhatsApp (custo).
- Alternativa: link personalizado enviado quando salão cria agendamento manual.

**Onde impacta:**
- [cliente/02-retorno.md](./cliente/02-retorno.md)
- [cliente/04-cancelamento.md](./cliente/04-cancelamento.md)

---

## 6. Merge de cadastros duplicados

**Status:** adiado; MVP não tem funcionalidade automatizada.

- Cliente que cadastrou WhatsApp digitado errado cria duplicata.
- Salão precisa poder mesclar dois cadastros preservando histórico dos dois.
- Definir regras: qual cadastro sobrevive, o que acontece com UUIDs órfãos, mescla de imagens/notas/agendamentos.

**Onde impacta:** [salao/11-clientes-historico.md](./salao/11-clientes-historico.md)

---

## 7. Validação de identidade da cliente

**Status:** MVP aceita WhatsApp sem validar.

- **Risco:** agendamentos "fantasma" com WhatsApp inventado.
- **Alternativa:** confirmação por código enviado ao WhatsApp (custo de API WhatsApp) OU pelo menos validação de formato + duplicata.
- Impacta pagamento? (cliente sem WhatsApp real ainda paga; salão fica sem contato).

**Onde impacta:**
- [cliente/01-primeiro-acesso.md](./cliente/01-primeiro-acesso.md)
- [salao/05-agendamento-manual.md](./salao/05-agendamento-manual.md)

---

## Pendências menores (revisitar quando surgir demanda real)

- **Combos / múltiplos procedimentos por agendamento** — decisão MVP: 1 por agendamento; salão cria "Corte+Escova" como procedimento único.
- **Categorias de procedimentos** — adiado; catálogo achatado no MVP.
- **Recorrência de disponibilidade** (ex.: "toda última sexta é folga") — cadastro data a data no MVP.
- **Cliente aceitar/recusar remarcação** — MVP: não; salão decide, cliente é comunicada.
- **Reversão de conclusão / no-show** — MVP: terminal; correção via suporte se necessário.
- **Múltiplos pagamentos parciais no valor restante** — MVP: um método só.
- **Notificar cliente após no-show** ("sentimos sua falta") — depende de canal WhatsApp.
- **Bloqueio de clientes com N no-shows** — fora do MVP.
- **Cancelamento em massa** pelo salão (ex.: fecha 3 dias) — um a um no MVP.
- **Snoozing/adiar lembrete** — editar data no MVP; snooze rápido fora.
- **Recorrência de lembrete** — fora do MVP.
- **Envio automático de mensagem à cliente por lembrete** (ex.: manutenção) — MVP notifica só o salão.
- **Exportação de faturamento (CSV/PDF)** — fora do MVP.
- **Gráficos no faturamento** — fora do MVP; foco em tabelas.
- **Comparativo período anterior no faturamento** — fora do MVP.
- **Reconciliação com extrato bancário/gateway** — fora do MVP.
- **Descontos concedidos** (registro explícito) — fluxo não desenhado.
- **Nota fiscal/recibo digital** — salão emite manualmente hoje; fora do MVP.
- **2FA para login do salão** — fora do MVP.
- **Login por WhatsApp código** — considerar v2.
- **Multi-salão para o mesmo dono** — 1 salão por usuário no MVP.
- **Pausar conta do salão temporariamente** (viagens, licença) — fora do MVP.
- **Domínio próprio do salão** (white-label) — fora do MVP; só subdomínio `nome.fluy.app`.
- **Ordem padrão da lista de clientes** — não decidido.
- **Cliente com múltiplos agendamentos simultâneos** — provavelmente permitir; confirmar.
- **Horário de verão** — assumido inexistente (verdade em 2026); revisitar se voltar.
- **Janela cruzando meia-noite** — bloqueado no MVP; sem suporte a atendimento noturno cruzando dias.

---

## Como usar este documento

- Antes de iniciar a modelagem ou implementação de um bloco, revisar as pendências relacionadas.
- Quando uma decisão for tomada, mover a entrada correspondente para o MD do fluxo afetado (seção "Regras de negócio") e remover daqui.
- Adicionar novas pendências aqui à medida que aparecem em novas discussões.
