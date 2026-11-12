# FLY-013 · Exceções e bloqueios de agenda: interface para folgas, feriados e horários especiais

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Painel do salão · Disponibilidade |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-012 · Disponibilidade semanal](./FLY-012-disponibilidade-semanal.md), [FLY-015 · Novo agendamento](./FLY-015-novo-agendamento-pelo-salao.md) |

## Descrição

Na tela de Disponibilidade existe um cartão **"Exceções e bloqueios — Cadastre folgas, feriados e horários especiais."**. Ele sempre mostra o texto fixo "Nenhuma exceção cadastrada.", sem botão, sem lista e sem nenhuma chamada à API (`frontend/src/app/features/salao/disponibilidade/pages/disponibilidade/disponibilidade.page.html:151-162`).

**Hoje não há como cadastrar exceção pela interface.** Uma dona que vai viajar ou fechar num feriado não consegue bloquear a agenda. As clientes continuam marcando nesses dias.

O resto da funcionalidade já existe:

- **Service do front.** `getListaOverrides`, `setOverride` e `deleteOverride` estão prontos em `disponibilidade.service.ts:63-115`, mas a página nunca os chama.
- **Backend.** Expõe `GET`, `PUT` e `DELETE` em `profissionais/:id/disponibilidade/overrides[/:data]` (`backend/src/modules/disponibilidade/disponibilidade.controller.ts:114, 140, 167`).
- **Schema.** `shared/schema/src/override_disponibilidade/`.
- **Limite da listagem.** No máximo 31 dias por consulta (`listarOverridesDisponibilidadeQuerySchema`).
- **Fluxo documentado.** `docs/flows/salao/03-disponibilidade.md` (seção de override) descreve: "Salão seleciona uma data no calendário… marcar fechado / janelas específicas / reverter".

As mensagens de validação usam o jargão "override" e o formato técnico "YYYY-MM-DD":

- `override_disponibilidade.schema.ts:23, 34, 42`;
- `disponibilidade.validator.ts:26, 34, 51`.

## Comportamento esperado

Na tela de Disponibilidade, uma seção **"Dias especiais"** (folgas, feriados, horários diferentes) tem:

- o botão **"Adicionar dia especial"**;
- a lista dos dias especiais futuros, em ordem de data, por exemplo "Sex, 25/12 · Fechado" ou "Sáb, 20/12 · 09:00–13:00";
- as ações **Editar** e **Voltar ao horário normal** em cada item. A segunda pede confirmação.

Ao adicionar, a dona escolhe:

- a data, num calendário;
- se é **"Fechado o dia todo"** ou **"Horário diferente"**, com um ou mais períodos e as mesmas regras da tela semanal.

Se já existirem agendamentos ativos na data fechada, o sistema avisa: "Você tem 2 agendamentos neste dia. Eles não serão cancelados automaticamente". O texto exato depende da regra que estiver em `docs/domain/disponibilidade.md`; se a regra não estiver definida, defini-la e documentar.

Os horários livres para a cliente e para o salão respeitam o dia especial assim que ele é salvo.

## O que precisa ser feito

**Frontend:**

- Seção de dias especiais na página de Disponibilidade, ou numa subpágina "Dias especiais" se a tela ficar longa.
- Listagem:
  - usar `getListaOverrides` com janelas de até 31 dias;
  - carregar o próximo mês sob demanda ("Ver mais").
- Modal de criação e edição:
  - calendário para a data (reaproveitar o componente da [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md) quando estiver pronto, ou `ion-datetime`);
  - opção fechado ou horário diferente;
  - períodos com as regras da [FLY-012](./FLY-012-disponibilidade-semanal.md);
  - salvar com `setOverride`.
- Remoção com confirmação, via `deleteOverride`.
- Avisos de sucesso (ver [FLY-020](./FLY-020-feedback-das-acoes.md)).

**Backend:**

- Se a dona fechar um dia com agendamentos ativos, devolver a contagem para o front exibir o aviso, ou criar um endpoint de pré-checagem.

**Mensagens:**

- Trocar "override" por "dia especial".
- Trocar "formato YYYY-MM-DD" por "Escolha uma data válida".

**Docs:**

- Atualizar `docs/flows/salao/03-disponibilidade.md` e `docs/features/gestao-disponibilidade.md` com o nome "dia especial" e a regra sobre agendamentos existentes.

## Critérios de conclusão

- [ ] A dona cadastra "Fechado" para uma data, e a página pública deixa de oferecer horários nesse dia.
- [ ] A dona cadastra "Horário diferente" para uma data, e só esses horários são oferecidos nesse dia.
- [ ] Os dias especiais futuros aparecem listados e podem ser editados ou removidos.
- [ ] Remover um dia especial pede confirmação.
- [ ] Fechar um dia com agendamentos ativos mostra um aviso.
- [ ] Nenhuma mensagem exibida usa "override" ou "YYYY-MM-DD".
