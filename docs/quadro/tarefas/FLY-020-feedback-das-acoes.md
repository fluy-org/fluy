# FLY-020 · Retorno visual das ações: aviso de sucesso padronizado em todo o painel

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta (é base para vários outros tickets) |
| **Área** | Transversal: painel do salão inteiro |
| **Origem** | Teste manual do dono (conclusão de agendamento sem retorno) + auditoria |
| **Relacionadas** | FLY-009, FLY-011, FLY-012, FLY-013, FLY-014, FLY-015, FLY-016 |

## Descrição

O app **não tem nenhum mecanismo de aviso de sucesso**: a busca por `ToastController` ou `ion-toast` em `frontend/src` não encontra nada. Por isso, quase toda ação termina sem retorno ao usuário. Ele não sabe se deu certo.

### Agenda e detalhe do agendamento

**Concluir, cancelar, remarcar e marcar falta.** Em `executarAcao` (`agendamento-detalhe.page.ts:463-487`), o app só fecha o modal (`acaoAberta.set(null)`).

- A única mudança visível é o selo do card no topo da página.
- O usuário está rolado até "Ações", lá embaixo. O que ele vê é o bloco virar "Este estado não permite nenhuma ação.", o que parece um erro.
- O lembrete automático de manutenção é criado depois da conclusão sem aviso nenhum.
- Ao remarcar para outro dia, o card some da agenda sem explicação.

**Novo agendamento.** A mensagem de sucesso aparece no fim do formulário e persiste. Isso é tratado na [FLY-015](./FLY-015-novo-agendamento-pelo-salao.md).

### Procedimentos

- Salvar fecha o modal sem aviso (`procedimentos.page.ts:213-215`).
- Desativar não dá retorno (`procedimentos.page.ts:227-253`).

### Clientes

- Criar fecha o modal sem aviso (`clientes.page.ts:157-174`).
- Editar, inativar e reativar na ficha também não avisam (`cliente-ficha.page.ts:175-185, 208-233`).

### Lembretes

- "Concluir" faz o item sumir na hora, sem aviso e sem desfazer (`secao-lembretes.component.ts:111-122`).

### Disponibilidade

- "Aplicar ao próximo dia" não dá retorno. Isso é tratado na [FLY-012](./FLY-012-disponibilidade-semanal.md).
- Salvar mostra apenas uma mensagem no fim da página.

### Configurações e onboarding

- Os saves de Pix e de regras não têm aviso padronizado.
- Criar o salão leva à agenda sem confirmação (`onboarding.page.ts:147`).

## Comportamento esperado

Toda ação que muda dados mostra um aviso curto e específico. O aviso diz o que aconteceu e, quando fizer sentido, oferece desfazer ou um atalho.

| Ação | Aviso |
| --- | --- |
| Concluir atendimento | "Atendimento concluído · R$ 50 em Pix registrado" |
| Concluir com lembrete criado | "Lembrete de retorno criado para 19/12" (junto ou em sequência) |
| Cancelar agendamento | "Agendamento cancelado. A cliente foi avisada." |
| Remarcar | "Remarcado para qui, 20/11 às 10:00" + "Ver na agenda" |
| Marcar falta | "Falta registrada · R$ 20 de sinal retido" |
| Novo agendamento | "Agendamento criado: qui, 19/11 às 09:30" |
| Salvar procedimento | "Procedimento salvo" |
| Desativar procedimento | "Procedimento desativado. Ele não aparece mais na sua página." |
| Criar cliente | "Cliente cadastrada" |
| Inativar ou reativar cliente | "Cliente inativada" ou "Cliente reativada" |
| Concluir lembrete | "Lembrete concluído" + "Desfazer" |
| Salvar disponibilidade | "Horários salvos" |
| Salvar dia especial | "Dia especial salvo" |
| Salvar Pix | "Chave Pix salva" |
| Salvar regras | "Configurações salvas" |
| Criar salão | "Salão criado!" |

**Erros** usam o mesmo componente, em variante de erro, com a mensagem amigável da [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md).

**No detalhe do agendamento**, depois de uma ação de estado, a tela também rola até o topo, onde fica o novo estado ou o card de desfecho (ver [FLY-016](./FLY-016-detalhe-do-agendamento.md)).

## O que precisa ser feito

**Serviço:**

- Criar `frontend/src/app/shared/services/aviso-tela.service.ts`, com um nome que não colida com o domínio "aviso". Pode se chamar `toast.service.ts`, já que é infraestrutura. Ele encapsula `ToastController` com os métodos:
  - `sucesso(mensagem, acao?)`;
  - `erro(mensagem)`;
  - `info(mensagem)`.
- Definir o padrão visual: posição (topo no celular, acima da barra inferior do painel), duração, cores do tema e botão de ação opcional.

**Aplicação:**

- Aplicar o serviço em todas as ações da tabela acima.
- No detalhe do agendamento, rolar até o topo depois de uma ação de estado.
- Para "Desfazer" no lembrete: verificar se existe endpoint de reabrir. Se não existir, criar um (`backend/src/modules/lembrete`), com filtro por `salao_id`.

**Documentação:**

- Registrar o padrão no `frontend/CLAUDE.md` ou em `frontend/architecture.md`: "toda mutação mostra um aviso pelo serviço X".

## Critérios de conclusão

- [ ] O serviço de aviso existe e está documentado como padrão.
- [ ] Todas as ações da tabela mostram o aviso correspondente.
- [ ] Concluir um agendamento mostra o aviso e deixa o novo estado visível sem rolar.
- [ ] Concluir um lembrete pode ser desfeito pelo aviso.
- [ ] Nenhum `ToastController` é usado diretamente nas páginas: tudo passa pelo serviço.
