# FLY-008 · Campo de WhatsApp: máscara única e validação brasileira

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Alta |
| **Área** | Schema compartilhado · Onboarding · Cadastro de clientes · Identificação da cliente |
| **Origem** | Teste manual do dono (nono dígito) + auditoria |
| **Relacionadas** | [FLY-007 · Dados do salão](./FLY-007-dados-do-salao.md), [FLY-014 · Clientes](./FLY-014-clientes-notas-e-lembretes.md) |

## Descrição

O WhatsApp aparece em três formulários:

- onboarding do salão;
- cadastro de cliente pelo salão;
- identificação da cliente na página pública.

Cada um tem máscara e limites próprios. Todos passam pela mesma normalização em `shared/schema/src/whatsapp/whatsapp.schema.ts`, que tem duas falhas:

- **Regex permissivo.** `^\+[1-9]\d{7,14}$` (linha 3) aceita qualquer DDI.
- **"+55" condicional.** O prefixo só é adicionado quando há exatamente 10 ou 11 dígitos sem "+" (linhas 17-25). Fora disso, os dígitos viram `+{dígitos}`, um número "internacional" que passa no regex.

### Onboarding: o nono dígito não entra

O campo (`onboarding.page.html:32-39`) reformata a cada tecla (`onboarding.page.ts:150-155`), tem `maxlength="15"` e placeholder "+55 (11) 99999-9999", com 19 caracteres, maior que o limite.

**Digitando "5511987654321":**

- ao chegar no 8º dígito, o texto vira "+55 (11) 9876-5432" e ocupa 18 caracteres;
- o navegador bloqueia o 9º dígito;
- **esse é o problema relatado.**

**Digitando sem o 55 ("11987654321"):**

- a primeira tecla já vira "+1";
- a partir daí o texto começa com "+" e a regra do +55 nunca dispara;
- o número é salvo como `+11987654321`, ou seja, DDI 1 (EUA), e passa no regex;
- o número aparece errado na página pública e o link wa.me do checkout quebra (`checkout.page.ts:120-121`).

**Colando "+55 11 98765-4321":** o texto é cortado em 15 caracteres e pode virar um número válido pelo regex, mas errado.

### Cadastro de cliente: número incompleto e colagem corrompida

O formulário (`formulario-cliente.component.html:15-23`) usa placeholder "(11) 99999-9999" e uma máscara que sempre assume Brasil (`formatarWhatsapp`, `formulario-cliente.component.ts:124-149`, com `slice(0, 11)` na linha 132).

- **Número incompleto passa.** Com 8 ou 9 dígitos, por exemplo "(11) 9999-999", vira `+119999999` e passa como número internacional válido. A cliente fica cadastrada com WhatsApp inválido, sem nenhum erro.
- **Colar do WhatsApp corrompe o número.** Colar "+55 11 99999-9999" é truncado pelo `maxlength`. A máscara remove o 55, sobram 9 dígitos e o resultado também é salvo errado.

### Mensagem de erro

A mensagem padrão é "Informe um WhatsApp com DDI e número válidos." (`whatsapp.schema.ts:36`). Nenhum formulário pede DDI, e a dona não sabe o que é DDI.

## Comportamento esperado

- **Um só componente.** Os três formulários usam o mesmo campo de WhatsApp:
  - prefixo fixo "+55" exibido fora do input;
  - máscara `(00) 00000-0000`, que também aceita fixo `(00) 0000-0000`;
  - teclado numérico;
  - exemplo no texto de apoio: "Com DDD. Ex.: (11) 98765-4321".
- **Colagem tolerante.** Colar em qualquer formato, como "+55 11 98765-4321", "5511987654321" ou "(11) 98765-4321", resulta no mesmo número.
- **Número incompleto recusado.** A mensagem é "Confira o número: faltam dígitos. Use DDD + número."
- **Número estrangeiro opcional.** Pode ficar fora do MVP. Se entrar, por um link explícito "Número de outro país", que desliga a máscara.
- **Formato gravado.** Sempre E.164 (`+5511987654321`).

## O que precisa ser feito

### Schema compartilhado (`whatsapp.schema.ts`)

**Normalização:**

- Sem "+" explícito, remover o 55 inicial quando houver 12 ou 13 dígitos.
- Depois disso, exigir 10 ou 11 dígitos e prefixar +55.
- Com "+", tratar como internacional.

**Validação de número brasileiro:** DDD válido (não começa com 0) e celular com 9 inicial, por exemplo `^\+55[1-9]{2}(9\d{8}|[2-5]\d{7})$`.

**Mensagens em pt-BR**, sem "DDI".

**Testes unitários dos formatos de entrada:** digitado, colado, com e sem 55, incompleto, fixo e celular.

### Frontend

- Criar o componente compartilhado `campo-whatsapp` em `frontend/src/app/shared/components/`, compatível com Reactive Forms (ControlValueAccessor):
  - formatação só visual;
  - normalização no blur ou no submit;
  - sem `maxlength` sobre o texto formatado.
- Usar o componente no onboarding (e na edição de dados da [FLY-007](./FLY-007-dados-do-salao.md)), no formulário de cliente e na identificação da página pública.

### Dados existentes

- Levantar quantos salões e clientes têm WhatsApp fora do padrão +55 (por exemplo, DDI 1 com 10 ou 11 dígitos).
- Decidir a correção: script de migração ou pedir correção na interface.

## Critérios de conclusão

- [ ] No onboarding, digitar "11987654321" grava `+5511987654321`.
- [ ] No onboarding, digitar "5511987654321" grava o mesmo valor.
- [ ] O nono dígito entra normalmente.
- [ ] Colar "+55 11 98765-4321" em qualquer um dos três formulários grava `+5511987654321`.
- [ ] Um número com 8 ou 9 dígitos é recusado com mensagem clara.
- [ ] Nenhuma mensagem menciona "DDI".
- [ ] Os três formulários usam o mesmo componente.
- [ ] Os testes unitários da normalização estão verdes.
- [ ] Os registros existentes com número inválido foram levantados e há decisão sobre a correção.
