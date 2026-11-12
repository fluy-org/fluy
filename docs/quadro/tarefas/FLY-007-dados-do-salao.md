# FLY-007 · Dados do salão: formulário de criação mais claro e edição posterior

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Onboarding · Configurações · Backend do salão |
| **Origem** | Teste manual do dono (endereço) + auditoria |
| **Relacionadas** | [FLY-008 · Campo de WhatsApp](./FLY-008-campo-de-whatsapp.md), [FLY-006 · Primeiros passos](./FLY-006-primeiros-passos-do-salao.md) |

## Descrição

### 1. Os dados do salão não podem ser alterados depois do cadastro

Nome, WhatsApp, endereço, fuso e subdomínio só são informados no onboarding.

- Configurações não tem esses campos.
- O backend não tem endpoint para alterá-los. Só existe `GET /saloes/eu` (`backend/src/modules/salao/salao-atual.controller.ts:22-36`). Nenhum `@Put` ou `@Patch` atualiza o salão.
- `docs/features/configuracao-do-salao.md` promete "Definir informações públicas do salão" e "Gerenciar subdomínio".

Qualquer erro de digitação fica para sempre, inclusive o WhatsApp gravado errado pelo bug da [FLY-008](./FLY-008-campo-de-whatsapp.md).

### 2. O endereço é um campo de texto livre, sem orientação

- É um `ion-textarea` só com o rótulo "Endereço", sem placeholder, sem exemplo e sem campos separados (`onboarding.page.html:50-56`).
- O schema exige só um texto não vazio (`shared/schema/src/salao/salao.schema.ts:31`). A coluna é `text` livre (`salao.table.ts:20`).
- O mesmo texto aparece cru em três lugares:
  - página pública (`pagina-cliente.page.html:197`);
  - confirmação (`confirmacao-agendamento.component.html:29`);
  - checkout (`checkout.page.html:53`).
- A dona não sabe se deve escrever cidade, CEP, referência ou complemento.

### 3. "Subdomínio" é jargão e a prévia está errada

- O campo se chama "Subdomínio".
- A nota fixa diz "meu-salao.fluy.app" e não reflete o que a dona digita (`onboarding.page.html:74-92`).
- O link real é `${window.location.origin}/s/{subdominio}` (`configuracao.page.ts:87-90`), outro formato.
- "Seu endereço público" fica logo abaixo de "Endereço" (o físico). São duas ideias de "endereço" na mesma tela.
- Digitar "Salão da Maria" é rejeitado com "Use de 3 a 100 caracteres minúsculos..." (`salao.schema.ts:9-16`). O texto não é convertido automaticamente.

### 4. Fuso horário sem explicação

- O rótulo é "Fuso horário", sem texto de apoio (`onboarding.page.html:60-68`).
- As opções são legíveis ("Brasília", "Manaus").
- O select usa `interface="action-sheet"`, que fica ilegível no tema escuro (ver [FLY-021](./FLY-021-padrao-visual-dos-formularios.md)).

## Comportamento esperado

**Endereço com campos guiados:**

- CEP, que preenche rua, bairro, cidade e UF automaticamente;
- número e complemento.

A página pública mostra o endereço formatado ("Rua X, 123 · Bairro · Cidade/UF") e um link "Abrir no mapa".

**"Link do seu salão" no lugar de "Subdomínio":**

- O valor é gerado automaticamente a partir do nome do salão (minúsculas, sem acento, espaço vira hífen).
- A dona pode editar.
- A prévia é real: `{origem}/s/{valor}`.

**Fuso:**

- O rótulo vira "Horário da sua cidade", com o apoio "Usado para mostrar os horários certos às suas clientes".
- O valor vem pré-selecionado pelo fuso do aparelho.

**Edição posterior:** Configurações tem o card **"Dados do salão"** para editar nome, WhatsApp, endereço, fuso e link.

- Mudar o link pede confirmação e avisa que o link antigo deixa de funcionar.
- Mudar o fuso também pede confirmação e explica o efeito sobre os horários já configurados.

## O que precisa ser feito

### Schema e backend

**Endereço:**

- Estruturar com `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade` e `uf`, em colunas novas ou num objeto.
- Criar uma migration que preserva o texto atual numa coluna legada, ou em `logradouro`, para salões existentes.
- Validar no schema compartilhado com mensagens em pt-BR.

**Edição:**

- Criar `atualizarSalaoSchema` (partial de `criarSalaoSchema`) e `PUT /saloes/eu`, filtrando por `salao_id` do tenant.
- O subdomínio verifica conflito e devolve uma mensagem amigável ("Este link já está em uso").
- Decidir e documentar se o subdomínio antigo redireciona por um tempo. Registrar a decisão em `docs/domain/salao.md`.

### Frontend

**Onboarding:**

- CEP com máscara, consultando um serviço público de CEP (ViaCEP ou equivalente) e preenchendo os demais campos.
- Os campos continuam editáveis se o CEP não for encontrado.
- Campo "Link do seu salão":
  - gerado a partir do nome enquanto a dona não o editar;
  - normalização ao digitar;
  - prévia com a origem real.
- Fuso: novo rótulo, texto de apoio e pré-seleção por `Intl.DateTimeFormat().resolvedOptions().timeZone`, quando estiver na lista.

**Configurações:** card "Dados do salão", reaproveitando os mesmos campos do onboarding num componente compartilhado.

**Página pública, confirmação e checkout:** endereço formatado e link para o mapa.

### Docs

- `docs/domain/salao.md`: novo formato do endereço e regras de edição.
- `docs/features/configuracao-do-salao.md`.
- `docs/flows/salao/01-onboarding.md`: corrigir a menção a `.fluy.app`.

## Critérios de conclusão

- [ ] A dona digita o CEP e vê o endereço preenchido; consegue completar número e complemento.
- [ ] O endereço aparece formatado e com link de mapa na página pública.
- [ ] Digitar "Salão da Maria" no nome sugere `salao-da-maria` no link, e a prévia mostra a URL real.
- [ ] A dona edita nome, WhatsApp, endereço, fuso e link em Configurações e vê as mudanças na página pública.
- [ ] Mudar o link pede confirmação.
- [ ] Um link já em uso mostra uma mensagem clara.
- [ ] Os salões existentes continuam exibindo o endereço antigo depois da migration.
