# FLY-010 · Login, convite e rotas: telas em português e sem becos sem saída

| Campo | Valor |
| --- | --- |
| **Responsável** | _a definir_ |
| **Status** | A fazer |
| **Prioridade** | Média |
| **Área** | Autenticação do salão · Roteamento |
| **Origem** | Auditoria |
| **Relacionadas** | [FLY-006 · Primeiros passos](./FLY-006-primeiros-passos-do-salao.md) (guards de salão) |

## Descrição

### 1. O formulário de login aparece em inglês

- `mountSignIn` é chamado sem `localization` (`frontend/src/app/core/services/auth/auth.service.ts:57-73`).
- O pacote `@clerk/localizations` não está no `frontend/package.json`.
- Resultado: o formulário embutido mostra "Sign in", "Continue", "Forgot password?".

### 2. Textos sem acento e jargão

**Login:**

- `login.page.html:11`: "seu salao".
- `login.page.ts:101`: "Nao foi possivel carregar o formulario".

**Concluir cadastro** (`concluir-cadastro.page.ts:39, 45-47, 52-53`):

- "ja", "primario", "sao", "Nao foi possivel", "conexao".
- "Conclua seu perfil no **Clerk**": a dona não sabe o que é Clerk.

### 3. Fluxos sem saída

**a. Convite aberto com uma sessão ativa**

- A página diz "Abra este convite depois de sair da conta atual".
- O único botão é "Ir para o login", e quem está logada é mandada ao painel.
- Não há como sair por ali (`convite.page.ts:52-56, 175-177`).

**b. Login que autentica, mas falha ao consultar a conta**

- O Clerk autentica, mas `GET /usuarios/eu` falha com um erro que não é 404.
- Aparece só a mensagem de erro (`login.page.ts:121-149`).
- O componente do Clerk já foi desmontado e não volta: não há formulário nem botão "Tentar novamente".

**c. Concluir cadastro com `perfil_incompleto`**

- "Tentar novamente" repete a mesma chamada para sempre (`concluir-cadastro.page.ts:44-49`).
- Não existe caminho para completar os dados que faltam.

**d. Onboarding** sem "Sair": tratado na [FLY-006](./FLY-006-primeiros-passos-do-salao.md).

### 4. Botão "Criar conta" do convite desabilitado sem explicação

- O botão usa `[disabled]="formulario.invalid || enviando()"` (`convite.page.html:109`).
- Como o botão desabilitado não dispara o submit, o `markAllAsTouched()` nunca roda e os erros dos campos não aparecem.
- A dona vê um botão cinza sem saber o que falta.
- Também não há opção de mostrar a senha.

### 5. Rotas mortas, duplicadas e ausência de 404

- **Rotas de demonstração do Ionic públicas.** `/tabs/tab1`, `/tabs/tab2` e `/tabs/tab3` mostram "Tab 1" e "Explore UI Components" (`app.routes.ts:56-59`, `features/demo`).
- **`/clientes` na raiz.** Carrega a `ClientesPage` fora do layout e **sem `authGuard`** (`app.routes.ts:75-80`).
  - Logada, a página abre sem menu.
  - Deslogada, as chamadas dão 401 e redirecionam ao login sem `returnUrl`.
  - Não vaza dados, porque a API exige autenticação, mas é uma rota quebrada. A rota correta é `/painel/clientes`.
- **Nenhuma rota coringa (`**`).** Nem na raiz nem no painel: uma URL errada termina em tela em branco.

## Comportamento esperado

- Todo o fluxo de entrada fica em português correto, inclusive o formulário do Clerk, sem mencionar "Clerk".
- Em nenhuma tela de autenticação a usuária fica sem um botão de próximo passo:
  - "Sair e usar este convite";
  - "Tentar novamente" e "Sair";
  - "Completar meus dados".
- O botão "Criar conta" fica sempre clicável, a menos que esteja enviando. Ao clicar com dados faltando, os erros aparecem em cada campo.
- A senha tem a opção de mostrar e ocultar.
- Não existem rotas de demonstração nem a rota duplicada `/clientes`.
- URL inexistente leva:
  - fora do painel, ao login ou a uma página "Página não encontrada" com link de volta;
  - dentro do painel, à agenda.

## O que precisa ser feito

**Localização do Clerk:**

- Instalar `@clerk/localizations` (workspace frontend).
- Passar `localization: ptBR` no `clerk.load`.
- Revisar os textos customizados.

**Acentuação e jargão:**

- Corrigir a acentuação em login, concluir cadastro e convite.
- Trocar "Clerk" por "sua conta".

**Saídas nos fluxos:**

- **Convite logada:** botão "Sair e usar este convite", que chama `authService.logout()` e recarrega a página com o mesmo ticket.
- **Login com falha na consulta:** botões "Tentar novamente" (refaz `GET /usuarios/eu`) e "Sair" (remonta o formulário).
- **Concluir cadastro com `perfil_incompleto`:** formulário de nome e sobrenome, se a API permitir atualizar o perfil. Se não permitir, "Sair e entrar novamente" com a explicação do que falta.

**Convite:**

- Deixar o botão habilitado e validar no submit.
- Adicionar `<ion-input-password-toggle slot="end">`.

**Rotas:**

- Remover a feature `demo` e as rotas correspondentes.
- Remover a rota raiz `/clientes`.
- Adicionar as rotas coringa na raiz e no painel.

## Critérios de conclusão

- [ ] O formulário de login está em português.
- [ ] Nenhum texto do fluxo de entrada tem acento faltando ou cita "Clerk".
- [ ] Os três becos sem saída têm uma ação clara de continuar ou sair.
- [ ] Clicar em "Criar conta" com campo faltando destaca o campo.
- [ ] A senha pode ser exibida.
- [ ] `/tabs/tab1` e `/clientes` não existem mais.
- [ ] Uma URL inexistente não deixa a tela em branco.
