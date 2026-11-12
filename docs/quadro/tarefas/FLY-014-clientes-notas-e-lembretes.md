# FLY-014 · Clientes, notas e lembretes: lista estável, ficha organizada e cadastro sem armadilhas

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Painel do salão · Clientes · Ficha da cliente · Lembretes |
| **Origem** | Teste manual do dono (cadastro de clientes) + auditoria |
| **Relacionadas** | [FLY-008 · Campo de WhatsApp](./FLY-008-campo-de-whatsapp.md), [FLY-021 · Padrão visual dos formulários](./FLY-021-padrao-visual-dos-formularios.md), [FLY-020 · Feedback das ações](./FLY-020-feedback-das-acoes.md) |

## Descrição

O dono pediu uma avaliação geral da experiência de clientes. Dois problemas estão em tickets próprios:

- o espaçamento dos campos (placeholder encostado na borda): [FLY-021](./FLY-021-padrao-visual-dos-formularios.md);
- o WhatsApp aceitando número incompleto ou corrompido ao colar: [FLY-008](./FLY-008-campo-de-whatsapp.md).

Os demais estão abaixo.

### Lista de clientes (`frontend/src/app/features/salao/clientes/pages/clientes/`)

**A lista pisca a cada letra digitada.** Cada digitação na busca (debounce de 250 ms) e cada troca de filtro chamam `carregar()`. Isso liga o estado de carregamento: a lista some e aparece "Carregando clientes..." (`clientes.page.ts:110-123, 176-190`; `clientes.page.html:72-76`).

**O carregamento pode se desencontrar.** O `finally` de uma requisição antiga pode desligar o carregamento enquanto a nova ainda está em andamento.

**Erro no "carregar mais" apaga a lista.** O erro substitui a lista inteira pela mensagem de erro (`ts:133`).

**Filtros e ordenação pequenos e escondidos:**

- Os filtros usam selects de 12px.
- A "Ordenação" fica escondida num `<details>` com resumo de 11px cinza (`clientes.page.scss`).

**Estado vazio sem orientação:**

- Mostra apenas "Nenhum cliente cadastrado.", sem botão.
- Não explica que as clientes também entram sozinhas ao agendar pelo link (`clientes.page.html:81-84`).

### Cadastro de cliente

**Criar não leva a lugar nenhum.** Criar fecha o modal e recarrega a lista, sem aviso e sem abrir a ficha da cliente criada (`clientes.page.ts:157-174`).

**WhatsApp duplicado sem saída.**

- A API responde "Já existe um cliente com este WhatsApp." (`backend/src/modules/cliente/cliente.service.ts:146-148`).
- Se a cliente existente estiver inativa, o filtro padrão (`status: 'ativos'`, `clientes-data.ts:8-12`) a esconde. A dona não a encontra e não consegue cadastrar.

**Gênero misturado nos textos:**

- "Novo cliente", "Nome do cliente", "Inativar cliente";
- ao lado de "Ativa/Inativa", "Esta cliente", "sobre a cliente".

**Classe sem estilo.** `fluy-formulario` (`formulario-cliente.component.html:5`) não existe em nenhum scss.

### Ficha da cliente (`.../pages/cliente-ficha/`)

**Cabeçalho e navegação diferentes do resto do painel:**

- Usa `ion-toolbar` cru com o título genérico "Cliente", em vez do `app-header` com o nome dela.
- Não tem `fluy-page-safe` nem a navegação do painel (`cliente-ficha.page.html:1-8`).

**Contato e edição:**

- O WhatsApp é texto puro, sem link para conversar (`resumo-cliente.component.html:9-11`).
- "Editar" fica desabilitado para cliente inativa, sem explicação (`cliente-ficha.page.html:59-65`).

**Retorno das ações.** Editar, inativar e reativar não dão aviso (`cliente-ficha.page.ts:175-185, 208-233`).

**Jargão na métrica.** "No-shows" (`metricas-cliente.component.html:20`).

**Histórico.** Usa rolagem infinita dentro de uma página longa (`historico-agendamentos.component.html:18-25`).

- O carregamento só dispara no fim da página, depois das galerias.
- Os itens novos entram acima e empurram o conteúdo.
- O próprio `ver-mais.component.ts:9-10` documenta esse problema. Notas e lembretes já usam "Ver mais".

**"Carregar mais" e "Ver mais"** convivem na mesma ficha.

**Galerias vazias sem explicação.** "Nenhuma imagem de referência." e "Nenhum anexo interno." não dizem de onde vêm as imagens (`galeria-cliente.component.html:29-31`).

### Lembretes (`frontend/src/app/features/salao/lembretes/`)

**Formulário com o mesmo problema de espaçamento.** Ver [FLY-021](./FLY-021-padrao-visual-dos-formularios.md).

**Data vazia com erro técnico:**

- A data começa vazia.
- Salvar sem data mostra "Informe uma data válida no formato YYYY-MM-DD." (`shared/schema/src/lembrete/lembrete.schema.ts:11-13`).

**"Concluir" sem volta.** O lembrete some na hora, sem confirmação e sem desfazer (`secao-lembretes.component.ts:111-122`).

## Comportamento esperado

### Lista de clientes

- **Busca e filtros:**
  - não escondem a lista;
  - um indicador discreto (barra de progresso no topo) mostra que está atualizando;
  - só a resposta mais recente é aplicada.
- **Erro em "carregar mais":** aparece como aviso, e a lista continua visível.
- **Filtros e ordenação:** legíveis (≥ 14px) e visíveis sem precisar expandir.
- **Estado vazio:**
  > "Suas clientes aparecem aqui quando agendam pelo seu link ou quando você as cadastra."

  Com o botão "Cadastrar cliente".

### Cadastro de cliente

- **Ao criar:** mostrar "Cliente cadastrada" e abrir a ficha dela.
- **WhatsApp que já existe:** o formulário mostra "Esta cliente já está cadastrada" com o botão "Abrir ficha", ou "Reativar" se estiver inativa.
- **Textos:** sempre no feminino ("cliente" é tratado como feminino no produto).

### Ficha da cliente

- **Cabeçalho:** padrão do painel, com o nome da cliente.
- **WhatsApp:** abre conversa (wa.me).
- **Editar em cliente inativa:** explica "Reative a cliente para editar", ou permite editar.
- **Métrica:** "Faltas" no lugar de "No-shows".
- **Histórico:** usa "Ver mais", igual a notas e lembretes.
- **Galerias vazias:**
  - "As fotos que a cliente envia ao agendar aparecem aqui."
  - "Os anexos que você adiciona num atendimento aparecem aqui."

### Lembretes

- **Data:** atalhos "Em 1 semana", "Em 1 mês" e "Escolher data".
- **Erro de data:** "Escolha a data do lembrete."
- **Concluir:** mostra o aviso "Lembrete concluído" com o botão "Desfazer".

## O que precisa ser feito

**Lista de clientes:**

- Separar o "carregamento inicial" do "atualizando".
- Usar `switchMap` (ou equivalente) para descartar respostas antigas.
- Erro do "carregar mais" como aviso, sem trocar o estado da lista.
- Ajustar o tamanho dos filtros e expor a ordenação.
- Estado vazio com texto e botão.

**Cadastro de cliente:**

- **Backend:** incluir no 409 de WhatsApp duplicado o `id` e o status da cliente existente (`cliente.service.ts`), mantendo o filtro por `salao_id`.
- **Frontend:**
  - tratar o 409 com "Abrir ficha" ou "Reativar";
  - navegar para a ficha depois de criar (`setEntidade` devolve o id).
- **Textos:** padronizar o gênero feminino em clientes, formulário, ficha e resumo.

**Ficha da cliente:**

- Usar `app-header` com o nome.
- Adicionar `fluy-page-safe` e a navegação do painel.
- Link wa.me no WhatsApp.
- Trocar o infinite scroll do histórico por `<app-ver-mais>`.
- Textos explicativos nas galerias vazias.
- "Faltas" na métrica (alinhado com a [FLY-022](./FLY-022-linguagem-mensagens-e-fuso.md)).

**Lembretes:**

- Atalhos de data.
- Mensagem amigável no `lembrete.schema.ts`.
- Aviso com "Desfazer" ao concluir. Se não houver endpoint de reabrir, avaliar criar um.

**Avisos de sucesso em todas as ações:** ver [FLY-020](./FLY-020-feedback-das-acoes.md).

## Critérios de conclusão

- [ ] Digitar na busca não faz a lista sumir.
- [ ] Erro em "carregar mais" não apaga a lista.
- [ ] Criar uma cliente abre a ficha dela com aviso de sucesso.
- [ ] Tentar cadastrar um WhatsApp já existente oferece "Abrir ficha" ou "Reativar".
- [ ] A ficha usa o cabeçalho padrão com o nome da cliente.
- [ ] O WhatsApp da ficha abre a conversa.
- [ ] O histórico carrega com "Ver mais".
- [ ] Nenhum texto da área usa "No-shows" ou mistura gênero.
- [ ] Os lembretes têm atalhos de data e mensagem amigável.
- [ ] Concluir um lembrete pode ser desfeito.
