# FLY-009 · Configurações: cadastro de Pix compreensível e regras do salão validadas

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Configurações do salão |
| **Origem** | Auditoria (relacionado ao relato do dono sobre o Pix) |
| **Relacionadas** | [FLY-006 · Primeiros passos](./FLY-006-primeiros-passos-do-salao.md), [FLY-022 · Linguagem e mensagens](./FLY-022-linguagem-mensagens-e-fuso.md) |

## Descrição

A tela de Configurações (`frontend/src/app/features/salao/configuracao/pages/configuracao/`) tem três cards. Este ticket trata do cadastro de Pix e das regras do salão. O link público é tratado na [FLY-006](./FLY-006-primeiros-passos-do-salao.md) e os dados do salão na [FLY-007](./FLY-007-dados-do-salao.md).

### Card "Recebimento Pix"

**Texto de apoio:**

- O texto atual é "Use a chave Pix da sua conta bancária atual. Este cadastro não abre uma conta nem verifica titularidade. Pagamentos online estão em homologação."
- "Titularidade" e "homologação" são jargão.
- O texto não explica para que serve a chave nem o que a dona perde sem ela.

**Tipos de chave:**

- Aparecem com os valores crus do enum: "cpf", "cnpj", "email", "telefone", "aleatoria" (sem acento) (`configuracao.page.html:30-34`).

**Validação da chave:**

- Não há placeholder nem máscara por tipo.
- Não há validação de CPF, CNPJ, telefone ou chave aleatória. O schema só faz `trim().min(1).max(200)` (`shared/schema/src/configuracao_salao/configuracao_salao.schema.ts:47-54`).
- Uma chave inválida só falha na hora em que a cliente tenta pagar.
- O backend só faz trim (e minúsculas no e-mail). Não foi confirmado se o provider rejeita telefone sem +55.

**Erros:**

- Salvar com o campo vazio mostra a mensagem padrão do Zod em inglês: "Too small: expected string to have >=1 characters" (`configuracao.page.ts:170-173`).
- Não há erro por campo (`app-field-error`).

**Estilo:**

- O botão de salvar do Pix tem estilo inline.
- Os cards de Pix e de link compartilham a classe `public-link-card` (`configuracao.page.html:11, 48-49`).

### Card de regras do salão

Os campos são numéricos: tempo de reserva, antecedência, granularidade, tolerância e outros.

**Limites:**

- Aceitam qualquer inteiro positivo, sem limite razoável. Uma granularidade de 1 minuto ou de 999 é aceita.

**Erros:**

- Um campo vazio mostra "Invalid input: expected number, received null", porque `numeroPositivoSchema` não tem mensagem própria (`configuracao_salao.schema.ts:4-7`).
- Só o primeiro erro aparece, sem indicar o campo (`configuracao.page.ts:234-237`).

**Explicação dos campos:**

- Os rótulos não dizem o efeito de cada regra para a cliente. Exemplo: o que é "granularidade" para uma dona de salão?

**Formulário:**

- O formulário usa `updateOn: 'blur'`. Apertar Enter sem sair do campo pode validar o valor antigo.
- Sair da tela com alterações não salvas não pede confirmação.

## Comportamento esperado

### Pix

**Texto:**

> "Cadastre a chave Pix onde você quer receber os sinais. Com ela, suas clientes pagam o sinal ao agendar e você reduz faltas."

**Tipos legíveis:** "CPF", "CNPJ", "E-mail", "Celular", "Chave aleatória".

**Placeholder, máscara e validação por tipo:**

- CPF: 11 dígitos com dígito verificador.
- CNPJ: 14 dígitos com dígito verificador.
- Celular: +55, reaproveitando o componente da [FLY-008](./FLY-008-campo-de-whatsapp.md).
- E-mail.
- Chave aleatória: formato UUID.

**Erros:** mensagens em pt-BR, embaixo do campo com problema.

**Depois de salvar:** um aviso de sucesso, e o card mostra o estado "Pix cadastrado: CPF •••.456.789-••".

### Regras do salão

**Rótulos e textos de apoio** em linguagem simples. Exemplos:

- "Intervalo entre horários oferecidos (ex.: a cada 30 min)";
- "Tempo para a cliente pagar o sinal antes de perder a reserva".

**Limites coerentes** no schema, por exemplo granularidade de 5 a 120 minutos.

**Erros por campo**, em pt-BR.

**Alterações não salvas:** sair com alterações pendentes pede confirmação.

## O que precisa ser feito

### Schema

- Em `atualizarRecebimentoPixSchema`, fazer `superRefine` por `tipo_chave`, com as validações acima e mensagens em pt-BR.
- Normalizar CPF e CNPJ para apenas dígitos e o celular para E.164.
- Em `configuracao_salao.schema.ts`, definir os limites de cada regra e a mensagem de campo obrigatório. Documentar os limites em `docs/domain/salao.md` ou `docs/features/configuracao-do-salao.md`.

### Frontend

- Mapa de rótulos dos tipos de chave na feature de configuração.
- Placeholder e máscara dinâmicos conforme o tipo.
- Reescrever os textos dos dois cards.
- `app-field-error` em cada campo.
- Remover `updateOn: 'blur'` ou garantir o commit no submit.
- Criar um guard `canDeactivate` com `formulario.dirty`.
- Remover os estilos inline e a classe compartilhada indevida.
- Aviso de sucesso ao salvar (ver [FLY-020](./FLY-020-feedback-das-acoes.md)).
- Exibir a chave mascarada quando ela já estiver cadastrada.

## Critérios de conclusão

- [ ] Os tipos de chave aparecem com rótulos legíveis.
- [ ] Cada tipo mostra exemplo e máscara próprios.
- [ ] CPF, CNPJ, celular, e-mail ou chave aleatória inválidos são recusados ao salvar, com mensagem em pt-BR no campo.
- [ ] Nenhuma mensagem em inglês aparece em Configurações.
- [ ] Cada regra do salão tem um texto de apoio explicando o efeito para a cliente.
- [ ] Valores fora dos limites são recusados.
- [ ] Sair com alterações não salvas pede confirmação.
- [ ] Salvar mostra confirmação.
