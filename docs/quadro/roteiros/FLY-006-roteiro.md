# Roteiro de Teste do Navegador: FLY-006

**Tarefa:** FLY-006 — Primeiros passos do salão: checklist de configuração, link em destaque e aviso de Pix  
**Objetivo:** Validar visualmente o fluxo de onboarding, a tela de Primeiros Passos (`/painel/primeiros-passos`), os alertas de pendência e banner de Pix na Agenda, a resiliência do link público em Configurações e a proteção de rotas com `comSalaoGuard` e `semSalaoGuard`.

---

## 1. Dados & Contas de Teste (Banco Local)

- **Salão Principal com Configuração Completa:**
  - Subdomínio: `teste` (ou salão da conta de teste local)
  - URL Pública: `http://localhost:4200/s/teste`
- **Contas de Teste:**
  - Usuário Proprietário (com salão vinculado): sessão ativa de dono local.
  - Usuário Sem Salão (se disponível no banco ou novo usuário de teste) para validar redirecionamento para `/onboarding`.
- **URLs Alvo:**
  - Painel: `http://localhost:4200/painel/agenda`
  - Primeiros Passos: `http://localhost:4200/painel/primeiros-passos`
  - Onboarding: `http://localhost:4200/onboarding`
  - Configurações: `http://localhost:4200/painel/configuracao`
  - Procedimentos: `http://localhost:4200/painel/procedimentos`
  - Página Pública: `http://localhost:4200/s/teste`

---

## 2. Cenário A: Guards de Acesso e Tela de Onboarding

### URL Alvo
`http://localhost:4200/onboarding`

### Passo a Passo Visual
1. Com uma conta já vinculada a um salão, digite diretamente no navegador a URL `http://localhost:4200/onboarding`.
2. Verifique que o `semSalaoGuard` intercepta a navegação e redireciona automaticamente para `/painel/agenda`, impedindo a reexibição desnecessária do formulário de criação.
3. Se estiver na tela de `/onboarding` (conta recém-criada sem salão):
   - Verifique que o topo da tela exibe na barra de navegação o botão **Sair** no canto direito.
   - Clique em **Sair** e confirme que o usuário é deslogado com sucesso e levado à página de login.
4. Preencha os dados do salão (Nome, WhatsApp, Endereço, Fuso horário e Subdomínio único) e clique em **Criar meu salão**.
5. Observe o redirecionamento:
   - A aplicação deve navegar para `/painel/primeiros-passos?sucesso=true` (e não mais direto para a agenda vazia).

### Checklist Visual (Cenário A)
- [ ] Conta com salão que tenta abrir `/onboarding` é redirecionada para `/painel/agenda`.
- [ ] A tela de onboarding possui o botão "Sair" na toolbar superior.
- [ ] Ao clicar em "Sair", a sessão é encerrada e a tela de login é exibida.
- [ ] Ao criar o salão, a navegação vai diretamente para `/painel/primeiros-passos?sucesso=true`.

---

## 3. Cenário B: Tela "Primeiros passos" e Checklist de Configuração

### URL Alvo
`http://localhost:4200/painel/primeiros-passos?sucesso=true`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/painel/primeiros-passos?sucesso=true`.
2. Verifique a exibição do banner de celebração no topo:
   - Título: *"Salão criado com sucesso!"*.
   - Mensagem de apoio para concluir as etapas.
3. Observe o cabeçalho e a barra de progresso:
   - Contador de progresso (ex: *"0 de 4 concluídos"* ou *"X de 4 concluídos"*).
   - Barra de progresso proporcional preenchida.
4. Verifique os 4 cartões do checklist:
   - **Passo 1 · Obrigatório: Cadastre seu primeiro procedimento**
     * Ícone de círculo ou check verde conforme o status.
     * Botão **Cadastrar procedimento** (ou **Ver procedimentos**).
     * Clique no botão: ele deve navegar para `/painel/procedimentos?novo=true` e o modal de criação de procedimento deve abrir **automaticamente**.
     * Verifique que o parâmetro `?novo=true` é limpo da URL após o modal abrir (evitando reabertura ao atualizar).
   - **Passo 2 · Obrigatório: Defina seus dias e horários de atendimento**
     * Clique em **Configurar horários**: deve navegar para `/painel/disponibilidade`.
   - **Passo 3 · Recomendado: Cadastre sua chave Pix**
     * Verifique o texto de alerta de valor: *"Sem Pix, suas clientes pagam tudo no salão e você não recebe sinal antecipado para evitar faltas."*
     * Clique em **Cadastrar chave Pix**: deve navegar para `/painel/configuracao`.
   - **Passo 4 · Divulgação: Compartilhe seu link**
     * Exibe o componente de link público com a URL formatada do salão (`/s/subdominio`).
     * Só fica com estilo de concluído verde quando os passos obrigatórios (1 e 2) estiverem concluídos.
     * Possui botão **Copiar link** (que muda para "Copiado!" com ícone de check) e botão **Compartilhar**.
5. Retorne para `/painel/primeiros-passos` através do botão Voltar ou pelo menu lateral:
   - Verifique que a tela atualiza seu status (`ionViewDidEnter`) sem exibir dados desatualizados.

### Checklist Visual (Cenário B)
- [ ] Banner de boas-vindas visível quando o parâmetro `sucesso=true` está presente.
- [ ] Barra de progresso e contador indicam o total correto de etapas concluídas.
- [ ] Botão do Passo 1 abre diretamente o modal de criação de procedimento.
- [ ] Parâmetro `?novo=true` não fica retido na URL ao fechar ou salvar o formulário.
- [ ] Botão do Passo 2 direciona para a tela de Disponibilidade.
- [ ] Botão do Passo 3 direciona para a tela de Configurações com texto claro sobre sinal e faltas.
- [ ] Passo 4 contém botões funcionais de copiar e compartilhar o link.
- [ ] Item "Primeiros passos" aparece no menu lateral do painel.

---

## 4. Cenário C: Agenda com Pendências, Link no Topo e Banner de Pix

### URL Alvo
`http://localhost:4200/painel/agenda`

### Passo a Passo Visual
1. Acesse `/painel/agenda` em um salão que possua pendências obrigatórias (sem procedimentos ou sem disponibilidade configurada).
2. Verifique o topo da página:
   - **Componente de Link Público:** exibido logo no início com a URL do salão, botão de copiar e compartilhar.
   - **Card de Pendência:** exibido em destaque com borda amarela:
     * Título: *"Falta pouco para receber agendamentos"*.
     * Mensagem contextual indicando o próximo passo (procedimento ou horários).
     * Botão de ação direta (ex: "Cadastrar procedimento" ou "Configurar horários") e botão "Ver checklist".
3. Se o salão não tiver chave Pix cadastrada:
   - Observe o **Banner de Aviso de Pix**:
     * Mensagem: *"Cadastre sua chave Pix: sem Pix, você não recebe sinal online das clientes e corre mais risco de faltas."*
     * Botão **Cadastrar Pix** levando a `/painel/configuracao`.
     * Botão com ícone de fechar (X).
   - Clique no botão (X) para dispensar:
     * O banner deve desaparecer imediatamente.
     * Atualize a página (F5): o banner continua dispensado (gravado em `localStorage` com escopo do subdomínio do salão).

### Checklist Visual (Cenário C)
- [ ] Link público do salão disponível no topo da agenda.
- [ ] Card de alerta de pendências presente quando faltam procedimento ou disponibilidade.
- [ ] Próximo passo indicado de acordo com a pendência real do salão.
- [ ] Banner de Pix explica a consequência da falta do Pix (risco de faltas e sem sinal online).
- [ ] Ao clicar no "X", o banner de Pix é dispensado e permanece oculto após recarregar a tela.

---

## 5. Cenário D: Link Público Resiliente em Configurações

### URL Alvo
`http://localhost:4200/painel/configuracao`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/painel/configuracao`.
2. Verifique a ordem das seções:
   - Recebimento Pix.
   - **Página de agendamento (Link Público):** cartão dedicado utilizando o componente `app-link-publico`.
   - Regras de funcionamento (formulário de configurações).
3. Simule ou observe o carregamento:
   - O card da Página de agendamento fica visível independentemente do estado do formulário de regras abaixo.
   - O botão "Copiar link" copia a URL para a área de transferência e exibe confirmação.

### Checklist Visual (Cenário D)
- [ ] O card do link público está posicionado fora do bloco condicional das regras de agendamento.
- [ ] Botões "Copiar link" e "Compartilhar" funcionam normalmente na tela de configurações.

---

## 6. Cenário E: Página Pública de Salão em Configuração

### URL Alvo
`http://localhost:4200/s/<subdominio>` (ex: salão recém-criado sem procedimentos)

### Passo a Passo Visual
1. Acesse o endereço público de um salão que ainda não possua procedimentos cadastrados.
2. Na etapa do catálogo de procedimentos:
   - Observe a mensagem centralizada de estado:
     * Ícone de brilho/aviso.
     * Texto: *"Este salão ainda está configurando a agenda."* (em vez de lista vazia genérica).
   - Se o salão cadastrou WhatsApp no onboarding:
     * Verifique o botão **Falar pelo WhatsApp** com ícone oficial do WhatsApp.
     * Clique no botão e confirme que direciona para `https://wa.me/55...` com mensagem pré-preenchida.

### Checklist Visual (Cenário E)
- [ ] Salão sem serviços exibe mensagem amigável: "Este salão ainda está configurando a agenda."
- [ ] Botão "Falar pelo WhatsApp" disponível com o link correto e DDI normalizado.
