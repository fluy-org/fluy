# FLY-012 · Disponibilidade: tela semanal clara, cópia de horários que funciona e salvar visível

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Painel do salão · Disponibilidade |
| **Origem** | Teste manual do dono + auditoria |
| **Relacionadas** | [FLY-013 · Exceções e bloqueios](./FLY-013-excecoes-e-bloqueios.md), [FLY-006 · Primeiros passos](./FLY-006-primeiros-passos-do-salao.md) |

## Descrição

A tela (`frontend/src/app/features/salao/disponibilidade/pages/disponibilidade/`) define os dias e horários em que as clientes podem agendar. Hoje ela não diz isso em lugar nenhum, e uma dona leiga não entende o que está configurando.

### 1. Estrutura confusa

A tela começa com um select **"Profissional"** (`disponibilidade.page.html:10-28`).

- No MVP existe um único profissional, então a pergunta confunde.
- A doc (`docs/features/gestao-disponibilidade.md`, Observações) diz que a interface deveria usar o profissional inicial sem perguntar.

Em seguida vêm **7 cartões**, um por dia da semana:

- o toggle de ligar e desligar não tem rótulo visível, só `aria-label` (html `56-62`);
- o resumo dos horários está em 11px cinza (html `69-72`, scss `114-118`);
- "Editar" está em 11px e só aparece com o dia ligado (scss `316-320`);
- "Aplicar ao próximo dia" está em 10px rosa e aparece em todos os cartões (scss `185-190`);
- os campos de hora não têm rótulo visível, só `aria-label` (html `96-110`);
- "Terca-feira" e "Sabado" estão sem acento (`disponibilidade.data.ts:4` e `:8`).

O botão **"Salvar disponibilidade"** fica no fim da página, sem indicação de alterações pendentes. Sair da tela descarta tudo sem aviso.

Num salão novo, todos os dias aparecem como "Sem atendimento neste dia". Nada avisa que a página pública fica sem horários até isso ser configurado.

A página não tem a navegação inferior do painel, e o voltar leva sempre para a agenda (html `2-5`).

### 2. "Aplicar ao próximo dia" parece não fazer nada

O handler `aplicarAoProximoDia` (`disponibilidade.page.ts:147-170`) **funciona**: copia os horários do dia para o dia seguinte, substituindo os que estavam lá. O problema é que o efeito não é percebido:

1. **Não salva.** Só altera o formulário. Nada persiste até "Salvar disponibilidade", no fim da página.
2. **Efeito invisível no caso comum.** Ligar um dia cria 09:00–18:00 por padrão (`ts:114-118`). Se os dois dias já estão em 09:00–18:00, a cópia não muda nada na tela.
3. **Nenhum retorno.** O handler até limpa as mensagens (`ts:168-169`). A mudança só aparece no resumo de 11px do outro cartão.
4. **Sábado → Domingo.** Domingo é o primeiro cartão. A mudança acontece no topo, fora da área visível.
5. **Armadilha destrutiva.** O botão aparece também em dias fechados (html `137-146`). Clicar nele num domingo fechado **apaga em silêncio os horários de segunda**.

### 3. "Adicionar período" cria um período sobreposto

- O novo período nasce sempre 09:00–18:00 (`ts:114-118`), igual ao primeiro.
- Ao salvar aparece "Janelas do mesmo dia não podem se sobrepor." (`janela_semanal.schema.ts:37`).
  - A mensagem não diz qual dia.
  - "Janela" é jargão.
- A mensagem "A hora de início deve ser anterior à hora de fim." (linha 22) também não diz o dia.

### 4. Alterações descartadas sem aviso

Três ações descartam edições sem confirmação:

- trocar de profissional (`ts:105-112`);
- clicar em "Cancelar", que recarrega a tela;
- desligar o toggle, que apaga os períodos do dia (`ts:138-144`). Religar o dia volta para 09–18.

### 5. Nenhum profissional ativo

- Se todos os profissionais estão inativos, aparecem 7 dias "Sem atendimento".
- Ligar um dia e salvar não faz nada: `salvarDisponibilidade` retorna em silêncio sem `profissionalId` (`ts:173-177`).

## Comportamento esperado

**Cabeçalho explicativo:**

> "Defina os dias e horários em que você atende. Suas clientes só conseguem agendar dentro desses horários."

**Profissional:** o select só aparece se houver mais de um profissional ativo.

**Cada dia mostra, em fonte legível (≥ 14px):**

- o nome do dia;
- o toggle com o rótulo "Aberto" ou "Fechado";
- os períodos ("09:00 – 12:00 · 13:00 – 18:00").

**Edição dos períodos:** campos com rótulo visível "Das" / "Às".

**Novo período:** começa depois do último período existente (fim 12:00 → novo 13:00–18:00).

**Copiar horários:**

- Vira **"Copiar para…"**, com escolha dos dias (atalhos "Dias úteis" e "Todos os dias").
- Só aparece em dias abertos.
- Depois de copiar, há retorno ("Horários copiados para Terça e Quarta") e destaque nos cartões alterados.

**Salvar:**

- Barra fixa no rodapé com "Salvar", que mostra "Alterações não salvas" quando houver.
- Sair, trocar de profissional ou cancelar com alterações pendentes pede confirmação.
- Desligar um dia e religar restaura os períodos anteriores.

**Erros:** dizem o dia e usam "horário" em vez de "janela" ("Em Terça, os períodos se sobrepõem"). O cartão do dia com erro fica destacado.

**Estados especiais:**

- Sem nenhum dia aberto, o aviso diz que a página pública não mostra horários.
- Sem profissional ativo, o estado vazio é explicativo, nunca um salvar silencioso.

## O que precisa ser feito

**Textos e estrutura:**

- Reescrever o cabeçalho e os rótulos (`disponibilidade.page.html`).
- Esconder o select com `@if (profissionais().length > 1)`.
- Corrigir os acentos em `disponibilidade.data.ts`.

**Estilo:**

- Subir as fontes para no mínimo 13–14px.
- Rótulo visível no toggle e nos campos de hora.

**Copiar:**

- Substituir `aplicarAoProximoDia` por "Copiar para…" (action sheet ou modal com checkboxes).
- Mostrar só em dia aberto.
- Retorno ao usuário e destaque nos cartões de destino.

**Períodos:**

- Novo período a partir do fim do último.
- Guardar os períodos do dia desligado para restaurar se religar.

**Alterações pendentes:**

- Signal `alterado`, comparando com a última resposta salva.
- Barra fixa de salvar (`ion-footer`).
- Confirmação ao descartar e guard `canDeactivate`.

**Erros:**

- Mensagens de `janela_semanal.schema.ts` com o dia no `path` ou na mensagem, e com o termo "horário".
- Destacar o cartão do dia com erro.

**Estados especiais e navegação:**

- Estado vazio de "nenhum profissional ativo".
- Aviso de "nenhum dia aberto".
- Navegação inferior do painel, como nas outras telas.

**Retorno ao salvar:** aviso de sucesso (ver [FLY-020](./FLY-020-feedback-das-acoes.md)).

## Critérios de conclusão

- [ ] Uma pessoa que nunca viu a tela entende, só pelo texto, que ela define os horários disponíveis para as clientes.
- [ ] Com um único profissional, não há select de profissional.
- [ ] "Copiar para…" copia os horários para os dias escolhidos e mostra quais dias mudaram.
- [ ] "Copiar para…" não aparece em dia fechado.
- [ ] Adicionar um segundo período não gera sobreposição automaticamente.
- [ ] As mensagens de erro citam o dia e não usam "janela".
- [ ] A barra de salvar está sempre visível e indica alterações pendentes.
- [ ] Sair da tela com alterações pendentes pede confirmação.
- [ ] Salvar sem profissional ativo nunca falha em silêncio.
