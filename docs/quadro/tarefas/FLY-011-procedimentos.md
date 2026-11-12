# FLY-011 · Procedimentos: duração em horas, valores em reais e sinal compreensível

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Painel do salão · Procedimentos |
| **Origem** | Teste manual do dono (duração, preço, sinal percentual) + auditoria |
| **Relacionadas** | [FLY-002 · Agendar sem pagamento online](./FLY-002-agendamento-sem-pagamento-online.md) (política de sinal), [FLY-021 · Padrão visual dos formulários](./FLY-021-padrao-visual-dos-formularios.md) |

## Descrição

Este ticket cobre o formulário de procedimento (`frontend/src/app/features/salao/procedimentos/components/formulario-procedimento/`) e a lista (`.../pages/procedimentos/`).

### 1. Duração só em minutos

- O campo é "Duração em minutos", `type="number"`, com placeholder "60" (`formulario-procedimento.component.html:99-106`).
- Para 2h30 a dona precisa calcular e digitar 150.
- A lista também mostra "150 min" (`procedimentos.page.html:90` e `:162`).
- Já existe `formatarDuracao()` duplicado em três lugares, mas a tela de procedimentos não usa nenhum deles:
  - `agenda/agenda-utils.ts:111`;
  - `catalogo-procedimentos.component.ts:28`;
  - `meus-agendamentos.component.ts:81`.

### 2. Preço sem formatação monetária

**No formulário:**

- "Preço" e "Valor do sinal" são `ion-input type="number"`, sem "R$" e sem máscara (html `108-115` e `127-134`).
- O placeholder "0,00" sugere vírgula, mas em `type=number` alguns navegadores e teclados transformam "49,90" em valor vazio.
- A roda do mouse altera o valor no desktop.

**Na lista:**

- Mostra o número cru: "R$ 49.9" ou "R$ 50" (`procedimentos.page.html:91` e `:163`).
- `formatarValor()` (Intl BRL) já existe em `shared/utils/formatacao.ts:3-8` e não é usado aqui.

### 3. Sinal percentual continua pedindo valor em reais

- O campo "Valor do sinal" tem placeholder fixo "0,00" e nenhum prefixo, sufixo ou explicação.
- Nada muda quando "Tipo do sinal" passa para "Percentual".
- O schema usa o mesmo `valorMonetarioSchema` para os dois tipos: aceita decimais e a mensagem fala em "valor" (`shared/schema/src/procedimento/procedimento.schema.ts:14-20, 35-36, 112-128`). A única diferença é o máximo de 100 no percentual.

**O que é o sinal:**

- Os campos não explicam o que é o sinal, nem que 0 significa "sem sinal".
- Com preço 0, o backend zera o sinal em silêncio (`backend/src/modules/procedimento/procedimento.validator.ts:16-17`), e a interface não avisa.
- "Orientações antes do procedimento" não diz quando a cliente vê o texto. Pela doc, ela vê na confirmação.

### 4. Mensagens de erro em inglês, longe do campo e uma por vez

- Duração, preço e sinal começam como `null` (ts `82-86`).
- Salvar sem preencher mostra "Invalid input: expected number, received null", a mensagem padrão do Zod 4.
- Só aparece o primeiro erro (`issues[0]`), num parágrafo abaixo de toda a lista (`ts:157-163`, `html:145-147`). No celular esse texto fica fora da tela, e nenhum campo fica vermelho.

### 5. Lista com elementos falsos e textos sem acento

- **Paginação fictícia.** O rodapé tem "Anterior / 1 / Proxima" e "10 por pagina", mas a lista exibe tudo (`procedimentos.page.html:115-123`, `:191-194`).
- **Coluna "Categoria" inútil.** Sempre mostra "Sem categoria". Categorias estão fora do MVP pela doc.
- **Acentos faltando:** "catalogo", "aparecera", "voce", "servico", "Proxima", "pagina", "Periodo de manutenção", "no maximo 5 MiB", "Previa".
  - Ocorrências em `procedimentos.page.html:49-50, :71, :91` e em `formulario-procedimento.component.html:25, :43, :138` e `.ts:123`.
- **Jargão "MiB".**
- **Seletor no celular.** O select de procedimentos fica com 12px (`procedimentos.page.scss`, por volta das linhas 353-355).

### 6. Ações sem confirmação nem retorno

- Salvar fecha o modal sem aviso (`procedimentos.page.ts:213-215`).
- Desativar um procedimento não pede confirmação, não explica que ele sai da página pública e não dá retorno (`procedimentos.page.ts:227-253`).
- O formulário usa `updateOn: 'blur'` e os botões ficam fora do `<form>` (`html:154-171`). Enter não envia, e o valor do select de tipo do sinal pode ficar pendente se o foco não sair dele antes de salvar. Este último ponto não foi confirmado executando a tela.

## Comportamento esperado

**Duração:**

- Escolhida em horas e minutos: dois seletores (0–8 h e 0–55 min de 5 em 5) ou atalhos (30 min, 1 h, 1h30, 2 h, outro).
- Exibida como "2h30" na lista e no restante do app.

**Preço:**

- Campo com prefixo "R$", máscara de moeda enquanto digita (49,90) e teclado numérico.
- Exibido como "R$ 49,90" na lista.

**Sinal:**

- **Fixo:** rótulo "Valor do sinal" e prefixo "R$".
- **Percentual:** rótulo "Percentual do sinal", sufixo "%", placeholder "30", inteiro de 1 a 100, e o valor calculado ao lado: "= R$ 15,00".
- **Explicação:** "Valor que a cliente paga para garantir o horário. Use 0 para não cobrar sinal."
- **Preço zero:** o sinal fica desabilitado, com a explicação.
- **Política:** o controle de "obrigatório ou opcional" da [FLY-002](./FLY-002-agendamento-sem-pagamento-online.md) entra aqui.

**Orientações:** texto de apoio "A cliente vê este texto ao confirmar o agendamento."

**Erros:** aparecem em cada campo, em pt-BR, e a tela rola até o primeiro campo inválido.

**Lista:** sem paginação fictícia e sem a coluna Categoria, com acentos corretos e "5 MB".

**Ações:**

- Salvar mostra "Procedimento salvo".
- Desativar pede confirmação: "Ele deixará de aparecer na sua página de agendamento".

## O que precisa ser feito

**Duração:**

- No front, compor `duracao_min = h*60 + m` em `dadosFormulario()` (ts:222).
- A API e o schema continuam em minutos, sem mudança no backend.

**Formatação:**

- Mover `formatarDuracao` para `shared/utils/formatacao.ts` e remover as três cópias.
- Usar `formatarDuracao` e `formatarValor` na lista.

**Moeda:**

- Criar uma diretiva ou componente de moeda BRL em `shared/` (`type="text" inputmode="decimal"`) que entrega um número ao FormControl.

**Sinal:**

- Campo dependente de `tipo_sinal` (signal derivado de `valueChanges`): rótulo, prefixo ou sufixo, placeholder e cálculo do equivalente.
- Revalidar `valor_sinal` ao trocar o tipo.
- No schema, separar a validação do percentual (`int().min(1).max(100)`, mensagem própria) da do valor fixo.

**Erros:**

- Mensagens em pt-BR em `procedimento.schema.ts` para campo obrigatório (`z.number({ error: ... })`). A configuração global de idioma está na [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md).
- Mapear `issue.path` para o `errorText` de cada `ion-input` e rolar até o primeiro campo inválido.

**Lista e formulário:**

- Remover a paginação e a coluna Categoria.
- Corrigir os acentos e o "MiB".
- Remover `updateOn: 'blur'` e mover os botões para dentro do form, ou para um `ion-footer` com `type="submit"`.

**Ações:**

- Confirmação de desativação e avisos de sucesso (ver [FLY-020](./FLY-020-feedback-das-acoes.md)).

## Critérios de conclusão

- [ ] A dona cadastra um procedimento de 2h30 sem digitar 150, e a lista mostra "2h30".
- [ ] A dona digita "4990" ou "49,90" no preço e vê "R$ 49,90", e a lista mostra "R$ 49,90".
- [ ] Com o sinal percentual, o campo mostra "%", aceita só inteiros de 1 a 100 e exibe o equivalente em reais.
- [ ] Com o preço 0, o sinal fica desabilitado com explicação.
- [ ] Salvar com campos vazios mostra mensagens em pt-BR nos próprios campos.
- [ ] A lista não tem paginação fictícia, coluna de categoria nem texto sem acento.
- [ ] Desativar pede confirmação, e salvar ou desativar mostra aviso de sucesso.
