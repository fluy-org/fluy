Você vai conduzir o planejamento da feature **{{FEATURE}}** da plataforma Pathly.

Antes de qualquer coisa, leia todos os documentos relevantes do projeto para entender completamente o contexto atual.

No mínimo, considere:

- A documentação da ideia da plataforma.
- A ordem de implementação.
- O `DOMAIN_MODEL.md`.
- O `FEATURES.md`.

Esses documentos são a fonte de verdade do projeto.

O `DOMAIN_MODEL.md` deve ser considerado a principal referência do domínio da aplicação.

Utilize-o para compreender:

- As entidades existentes.
- Os relacionamentos.
- As responsabilidades de cada entidade.

Não questione decisões já definidas no modelo de domínio.

Caso, durante o planejamento, perceba que esta feature exige alterar ou expandir o domínio da aplicação, pare e me pergunte antes de continuar.

---

# Regras gerais

- Não implemente nada.
- Não escreva código.
- Não assuma regras de negócio.
- Não invente comportamentos.
- Não proponha funcionalidades fora do escopo da feature.
- Sempre reutilize as definições já existentes do projeto.
- Não redefina entidades, regras ou comportamentos que já estejam documentados.
- Sempre que existir alguma decisão em aberto, pare e me pergunte.
- Sempre priorize soluções simples.
- Caso encontre alguma oportunidade de reduzir complexidade sem perder valor para o usuário, proponha antes de seguir.

---

# Etapa 1 — Entendimento da feature

Primeiro, faça um resumo da feature contendo:

- Objetivo.
- Problema que ela resolve.
- Como ela se encaixa dentro da plataforma.
- Dependências com outras features.
- Possíveis impactos em funcionalidades já existentes.

Caso encontre inconsistências ou ambiguidades entre os documentos do projeto, pare e me pergunte antes de continuar.

---

# Etapa 2 — Levantamento das regras

Antes de levantar novas regras, identifique quais entidades do `DOMAIN_MODEL.md` participam desta feature.

Verifique como elas se relacionam.

Sempre reutilize o domínio existente.

Somente proponha novas entidades, relacionamentos ou atributos quando forem realmente necessários.

Agora identifique tudo que precisa ser decidido antes da implementação.

Considere principalmente:

- Fluxo do usuário.
- Regras de negócio.
- Estados possíveis.
- Validações.
- Casos de borda.
- Relacionamentos entre entidades.
- Permissões (quando aplicável).
- Impacto em outras partes do sistema.

Nunca invente respostas.

Sempre faça perguntas quando alguma decisão depender de mim.

Sempre que possível, faça apenas uma pergunta por vez para manter a conversa objetiva.

---

# Etapa 3 — Revisão crítica

Depois que todas as decisões forem tomadas, faça uma análise crítica da feature.

Procure por:

- Fluxos desnecessariamente complexos.
- Regras redundantes.
- Validações que podem ser simplificadas.
- Casos que podem gerar retrabalho no futuro.
- Funcionalidades que não agregam valor suficiente ao MVP.
- Oportunidades de reduzir atrito para o usuário.

Caso encontre alguma oportunidade de melhoria ou simplificação, apresente-a antes de continuar.

---

# Etapa 4 — Documento da feature

Depois que todas as dúvidas forem resolvidas, gere um documento Markdown contendo:

- Objetivo
- Escopo
- Fora do escopo
- Fluxo do usuário
- Regras de negócio
- Estados
- Validações
- Casos de borda
- Dependências
- Critérios de aceite

O documento deve refletir apenas decisões tomadas durante nossa conversa.

Não invente informações.

---

# Etapa 5 — Estratégia de testes

Antes de gerar o plano de implementação, analise como essa feature deve ser validada.

Liste todos os cenários relevantes de teste.

Agrupe os testes em:

- Crítico
- Importante
- Opcional

Para cada cenário, informe:

- O que será validado.
- O comportamento esperado.
- O motivo pelo qual esse teste existe.

Não escreva os testes.

O objetivo é apenas definir quais cenários deverão ser cobertos durante a implementação.

Caso algum fluxo não faça sentido ser testado, explique o motivo.

---

# Etapa 6 — Plano de implementação

Depois que toda a especificação estiver concluída, divida a implementação em pequenas fases.

Cada fase deve conter:

- Objetivo.
- O que será implementado.
- Dependências.
- Critério de conclusão.

As fases devem ser independentes sempre que possível.

O objetivo é permitir implementar uma fase por vez, reduzindo o risco de regressões e facilitando revisões.

---

# Resultado esperado

Ao final desta conversa, devo ter:

1. Todas as regras da feature definidas.
2. Um documento Markdown completo da feature.
3. Uma estratégia de testes definida.
4. Um plano de implementação dividido em pequenas fases.

Somente depois disso a feature será considerada pronta para implementação.
