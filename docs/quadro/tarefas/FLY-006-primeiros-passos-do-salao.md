# FLY-006 · Primeiros passos do salão: checklist de configuração, link em destaque e aviso de Pix

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Pós-cadastro · Agenda · Navegação do painel |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-007 · Dados do salão](./FLY-007-dados-do-salao.md), [FLY-009 · Configurações e Pix](./FLY-009-configuracoes-e-pix.md), [FLY-002 · Agendar sem pagamento online](./FLY-002-agendamento-sem-pagamento-online.md) |

## Descrição

### Depois de criar o salão, a dona cai numa agenda vazia, sem orientação

O "onboarding" atual é só um formulário com nome, WhatsApp, endereço, fuso e subdomínio (`frontend/src/app/features/salao/onboarding/`).

**O que o backend cria** (`backend/src/modules/salao-onboarding/salao-onboarding.repository.ts:47-79`):

- o salão;
- o vínculo de dona;
- a configuração padrão;
- um profissional.

**O que fica de fora:**

- nenhum procedimento;
- nenhuma disponibilidade;
- nenhuma chave Pix.

Ao terminar, o app faz `router.navigate(['/painel/agenda'])` sem nenhuma mensagem (`onboarding.page.ts:147`).

**O que a doc promete e não existe:**

- `docs/flows/salao/01-onboarding.md`, passo 10: "Sistema conduz o dono para configurar pelo menos 1 procedimento".
- Passo 13: "sistema exibe a URL pública do salão para compartilhar".

**Consequência:** o salão só recebe agendamentos depois de ter procedimento e disponibilidade, e nada na interface diz isso. Uma dona sem tutorial pode divulgar o link com a página pública sem nenhum horário.

### O link público está escondido

- O link só aparece em `/painel/configuracao`, no segundo card, abaixo do Pix.
- Configurações só é acessível pelo menu hambúrguer. A barra inferior tem Agenda, Procedimentos, Clientes, Lembretes e Faturamento (`navegacao-painel.component.ts:196-214`).
- O card fica dentro do `@else` do carregamento das configurações (`configuracao.page.html:74-134`). Se `GET /salao/configuracao` falhar, o link some, mesmo vindo de outra chamada.
- Nenhuma outra tela do painel mostra o link.

### Nada avisa que falta o Pix

- O único lugar que fala de Pix é o card em Configurações.
- O texto do card não diz a consequência. Hoje, sem Pix a cliente não consegue agendar procedimento com sinal (ver [FLY-002](./FLY-002-agendamento-sem-pagamento-online.md)). Depois da FLY-002, a consequência será "não recebe pagamento antecipado".
- Não há badge, banner nem pendência em nenhuma tela.

### Rotas e guards não consideram se a conta tem salão

- O `authGuard` só checa a sessão.
- Uma conta sem salão que abre `/painel/agenda` recebe "Salão não encontrado." em cada tela.
- Quem já tem salão e abre `/onboarding` vê o formulário de novo.
- O onboarding não tem botão "Sair": quem entrou com a conta errada fica preso (`onboarding.page.html:1-5`).

## Comportamento esperado

**Ao terminar o cadastro**, a dona vê "Salão criado!" e é levada para **Primeiros passos**, um checklist com o progresso de cada item:

1. **Cadastre seu primeiro procedimento.** Leva a Procedimentos com o formulário aberto.
2. **Defina seus dias e horários de atendimento.** Leva a Disponibilidade.
3. **Cadastre sua chave Pix** (opcional, recomendado). Leva a Configurações, com o texto "Sem Pix, suas clientes pagam tudo no salão e você não recebe sinal antecipado para evitar faltas."
4. **Compartilhe seu link.** Mostra o link com os botões "Copiar" e "Enviar pelo WhatsApp".

Enquanto houver pendências obrigatórias (1 e 2):

- a agenda mostra um card "Falta pouco para receber agendamentos" com o próximo passo;
- a página pública mostra "Agenda em configuração" em vez de uma lista vazia, se ainda não faz isso (verificar).

Enquanto não houver Pix, um banner discreto e dispensável na agenda explica o que a dona perde e leva ao cadastro.

O link do salão fica sempre a um toque, com copiar e compartilhar:

- no topo da agenda ou no cabeçalho do painel;
- no menu.

**Guards:**

- Conta sem salão é levada ao onboarding.
- Conta com salão que abre `/onboarding` vai para o painel.
- O onboarding tem "Sair".

## O que precisa ser feito

### Backend

- Criar o endpoint de status de configuração, por exemplo `GET /saloes/eu/setup`, filtrando por `salao_id` do tenant. Ele devolve:
  - `tem_procedimento_ativo`;
  - `tem_disponibilidade`;
  - `tem_pix`;
  - `subdominio`.

### Frontend

**Tela "Primeiros passos":**

- Criar `/painel/primeiros-passos`, com os itens e o progresso.
- Redirecionar o fim do onboarding para ela, com o aviso de sucesso.
- Os atalhos levam direto à ação. Procedimentos abre o modal de novo procedimento, por exemplo via query param.

**Componente de link público:**

- Extrair um componente `link-publico` com URL, "Copiar" e "Compartilhar". O compartilhar usa `navigator.share` e cai para wa.me quando não houver suporte.
- Usar o componente em:
  - Primeiros passos;
  - topo da agenda ou cabeçalho do painel;
  - Configurações.
- Em Configurações, tirar o card do link de dentro do `@else`.

**Card e banner na agenda:**

- Card de pendências enquanto o checklist obrigatório não estiver completo.
- Banner de Pix enquanto `tem_pix` for falso, dispensável e lembrado depois de alguns dias.

**Navegação:**

- Adicionar "Primeiros passos" ao menu enquanto houver pendência.

**Guards:**

- `comSalaoGuard` com cache de `/usuarios/eu`: sem salão, vai para `/onboarding`.
- O inverso no `/onboarding`.
- Botão "Sair" no onboarding.

**Página pública:**

- Verificar o estado de salão sem procedimento ou sem disponibilidade.
- Se for uma lista vazia, mostrar "Este salão ainda está configurando a agenda", com o WhatsApp do salão.

### Docs

- Atualizar `docs/flows/salao/01-onboarding.md` (passos 10 a 13) com o checklist.

## Critérios de conclusão

- [ ] Ao criar o salão, a dona vê uma confirmação e cai em Primeiros passos.
- [ ] Cada item do checklist leva direto à ação e fica marcado como feito quando concluído.
- [ ] A agenda mostra as pendências até haver procedimento ativo e disponibilidade.
- [ ] O link público aparece na agenda (ou no cabeçalho) com copiar e compartilhar.
- [ ] O link continua visível em Configurações mesmo se a configuração falhar ao carregar.
- [ ] Sem Pix, há um banner explicando a consequência, com atalho para o cadastro.
- [ ] Conta sem salão nunca vê "Salão não encontrado." no painel.
- [ ] Conta com salão não vê o formulário de onboarding.
- [ ] O doc de onboarding está atualizado.
