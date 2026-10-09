# Bloco 8 — Anexos em agendamento

**Dono único: 🔵 Leandro.** Feature vertical completa: imagens vinculadas a um
agendamento, das duas pontas.

Roda **em paralelo** com o [Bloco 7](./bloco-7-faturamento.md).

## Por que este bloco existe assim

`anexo_agendamento` é a entidade mais cross-surface do domínio: a cliente envia
imagem de referência ao marcar, o salão anexa foto interna ao atender, e as
duas aparecem em galerias separadas na ficha. No plano anterior isso estava
fatiado em três lugares (2.9 no motor, dentro de 4.3 e dentro de 2.8), com
donos diferentes tocando a mesma tabela e as mesmas regras de visibilidade.

Solução: **adiar a feature inteira para depois que as duas superfícies
existirem** e entregá-la de uma vez, com um dono. O custo é que o fluxo da
cliente e a conclusão nascem sem imagem nos blocos 3 e 4 — incremento aceito,
ninguém fica bloqueado.

## Entregável do bloco

Ao final:

- A cliente anexa imagens de referência ao criar um agendamento.
- O salão anexa até 3 imagens internas por agendamento, nunca visíveis para a cliente.
- O card da agenda mostra o indicador de imagens e permite visualizar.
- A ficha da cliente mostra duas galerias unificadas ao longo de todo o histórico.

## Estado do schema

`arquivo` e `anexo_agendamento` (com
`VISIBILIDADE_ANEXO = ['publica_para_cliente','interna_do_salao']`) **já
existem** em `shared/schema/src/` desde [0.4](./bloco-0-fundacao.md), e o
módulo de storage sobre o R2 já existe desde
[1.6-BE](./bloco-1-setup-salao.md#16-be-anexos). Nenhuma fatia aqui cria tabela
nem configura storage novo.

---

## Fatias

### 8.1 Módulo de anexos e anexos internos do salão

- [x] Backend completo de `anexo_agendamento` + upload e visualização de anexos internos pelo painel. — **🔵 Leandro** — [DEP: 1.6-BE](./bloco-1-setup-salao.md#16-be-anexos) · [DEP: 3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento) · [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual)

**O que deve existir**

*Backend*

- Módulo de `anexo_agendamento` sobre o storage já existente: anexar arquivo a um agendamento com visibilidade, listar e remover.
- **Regra de visibilidade, que é a mais crítica do bloco:** anexo `interna_do_salao` nunca aparece em nenhuma resposta da superfície pública da cliente. Vale teste dedicado no endpoint público.
- Validação por conteúdo de JPEG, PNG e WebP, até 5 MiB, **rejeitando sem comprimir**.
- Limite de **3 anexos internos por agendamento**.
- Cada arquivo pertence ao salão que fez o upload e só pode ser vinculado dentro desse tenant.
- Contagem de anexos exposta na listagem da agenda, para o indicador do card.

*Frontend*

- Upload de anexos internos a partir do detalhe do agendamento e também do modal de conclusão ([3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual)) — o fluxo 07 permite antes ou depois de concluir.
- Visualização dos anexos no detalhe.
- **O indicador de imagens no card da agenda passa a acender de verdade** — foi previsto vazio em [3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento).

**Fora desta fatia**

- Imagens de referência da cliente e galerias → 8.2.
- Fora do MVP, confirmado nos docs: mais de uma imagem por procedimento, galeria de várias imagens no catálogo.

**Decisões que precisam estar fechadas antes**

- Limpeza de órfãos: depois de quanto tempo de retenção o arquivo físico é removido?

**Decisão:** arquivos órfãos são removidos após 24 horas.

**Critério de conclusão**

Anexar 3 imagens internas a um agendamento, tentar a quarta e ser bloqueado;
tentar um arquivo acima de 5 MiB e ser rejeitado; conferir o indicador no card;
e **confirmar pela API pública da cliente que os anexos internos não aparecem**.

**Tamanho estimado:** ~60-70 arquivos.

---

### 8.2 Imagens de referência da cliente e galerias na ficha

- [ ] Upload de referências no fluxo da cliente + as duas galerias unificadas na ficha. — **🔵 Leandro** — [DEP: 8.1](#81-módulo-de-anexos-e-anexos-internos-do-salão) · [DEP: 4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente) · [DEP: 5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente)

**O que deve existir**

*Backend*

- Endpoint público, escopado pela sessão da cliente, para anexar imagens com visibilidade `publica_para_cliente` ao próprio agendamento.
- Galerias da ficha: todas as imagens de referência da cliente **ao longo de todos os agendamentos dela**, e todos os anexos internos do salão, em conjuntos separados.

*Frontend — cliente*

- Upload de múltiplas imagens de referência durante a criação do agendamento ([4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente)), com preview e o mesmo limite de tipo e tamanho.
- Visualização das próprias imagens no detalhe do agendamento.

*Frontend — painel*

- Imagens de referência visíveis no detalhe do agendamento, para o salão consultar durante o atendimento.
- As duas galerias na ficha da cliente, preenchendo os slots reservados em [5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente).

**Fora desta fatia**

- Fora do MVP, confirmado nos docs: a cliente apagar imagem já enviada, o salão anexar referência em nome da cliente (ver decisões).

**Decisões que precisam estar fechadas antes**

- Existe limite de imagens de referência por agendamento? Os docs cravam 3 para anexo interno e 1 para imagem de procedimento, mas não falam de teto para referência.
- O salão pode anexar imagem de referência em agendamento manual (a foto que a cliente mandou por WhatsApp)? Não está nos fluxos — decidir se entra.
- LGPD: excluir a cliente apaga os anexos dela? Liga com a decisão da [5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente).

**Decisões:** o MVP aceita até 3 imagens de referência por agendamento; o
salão não envia referência em nome da cliente; a inativação preserva os
anexos e a política de exclusão definitiva fica para a implementação de
expurgo LGPD.

**Critério de conclusão**

Criar um agendamento pela cliente anexando duas referências; ver as imagens no
detalhe do agendamento no painel; criar um segundo agendamento com mais uma
imagem e conferir que a **galeria da ficha consolida as três**, separada da
galeria de anexos internos.

**Tamanho estimado:** ~55-65 arquivos.

---

## Dependências

Depende dos blocos 3, 4 e 5 — **todos mergeados** quando este bloco abre. Ele
toca telas que o 🟣 Rudney construiu (agenda, conclusão, ficha), mas só depois
de estáveis: risco de merge, não de bloqueio.

## Sequência

8.1 → 8.2. O módulo e a regra de visibilidade primeiro; a ponta da cliente e as
galerias depois.

## Notas

- **Anexo interno nunca vaza para a cliente.** É a regra mais crítica do bloco.
- Imagem de procedimento removida do catálogo faz agendamentos passados exibirem "sem imagem" retroativamente — comportamento já aceito nos docs, e não se aplica a anexo de agendamento, que é preservado.
