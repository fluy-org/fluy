# Roteiro de Teste E2E (Autônomo via Navegador) · FLY-001

> **Destinatário:** Agente autônomo de teste com controle de navegador (Claude / Playwright / Antigravity Browser).  
> **Objetivo:** Validar de ponta a ponta a contenção de segurança e regras de sessão não-verificada na página pública do salão.

---

## 1. Pré-requisitos do Ambiente

- **Serviços Ativos:**
  - Banco de Dados PostgreSQL na porta `5432`.
  - Backend NestJS ativo em `http://localhost:3001`.
  - Frontend Angular ativo em `http://localhost:4200`.
- **Comando para subir o ambiente (se necessário):**
  ```bash
  npm run dev
  ```
- **Dados no Banco Local Utilizados:**
  - Salão de teste: `subdominio = teste`
  - Cliente cadastrada existente: `Nome = Rudney2`, `WhatsApp = 11888888888` (possui agendamentos ativos pré-existentes).

---

## 2. Roteiro de Execução Passo a Passo

### Cenário 1: Identificação em Novo Dispositivo com WhatsApp Alheio (Sessão Não-Verificada)

- [ ] **Passo 1.1 — Limpeza de Estado Local**
  - Abrir o navegador em modo anônimo ou limpar `localStorage` para a origem `http://localhost:4200`.
  - Navegar para: `http://localhost:4200/s/teste`.
  - **Verificação:** A página deve exibir o formulário de identificação da cliente solicitando "Nome", "WhatsApp" e o checkbox de privacidade.

- [ ] **Passo 1.2 — Preenchimento com WhatsApp Existente e Nome Diferente**
  - No campo **Nome**, preencher: `Carlos Visitante`.
  - No campo **WhatsApp**, preencher: `11888888888` (número pertencente à cliente cadastrada `Rudney2`).
  - Marcar o checkbox de consentimento de privacidade.
  - Clicar no botão **Continuar** (ou submit).

- [ ] **Passo 1.3 — Verificação Crítica de Não-Exposição (LGPD)**
  - **Verificação 1 (Nome):** O cabeçalho/saudação deve exibir **"Olá, Carlos Visitante"** (ou mensagem genérica).
  - **Asserção Negativa Obrigatória:** O nome **"Rudney2"** **NÃO PODE** aparecer em nenhum lugar da tela.
  - **Verificação 2 (Histórico Oculto):** Clicar em "Meus agendamentos" (ou rolar até a seção de agendamentos). A lista deve estar vazia (exibindo "Nenhum agendamento encontrado").
  - **Asserção Negativa Obrigatória:** Os agendamentos anteriores de `Rudney2` **NÃO PODEM** ser listados.
  - **Verificação 3 (Avisos Ocultos):** Nenhum aviso antigo destinado a `Rudney2` deve aparecer.

---

### Cenário 2: Agendamento e Cancelamento pela Sessão Não-Verificada

- [ ] **Passo 2.1 — Criar Novo Agendamento**
  - Clicar em **Agendar procedimento**.
  - Selecionar o primeiro procedimento disponível na lista.
  - Selecionar uma data futura e um horário livre.
  - Confirmar o agendamento até a tela de sucesso.

- [ ] **Passo 2.2 — Visibilidade do Agendamento Criado**
  - Retornar à página inicial / Meus Agendamentos.
  - **Verificação:** O agendamento recém-criado **DEVE** aparecer na lista da cliente (pois foi criado por esta sessão `sessao_cliente_id`).

- [ ] **Passo 2.3 — Cancelamento Autorizado da Própria Sessão**
  - Clicar no agendamento recém-criado para abrir os detalhes.
  - Clicar no botão **Cancelar agendamento**.
  - Confirmar o cancelamento no modal/alerta.
  - **Verificação:** O agendamento deve mudar de estado para "Cancelado" com sucesso.

---

### Cenário 3: Revogação da Sessão e Botão "Sair"

- [ ] **Passo 3.1 — Ação de Sair**
  - Na página inicial do cliente, localizar o botão **Sair** no cabeçalho ou nas opções de identificação.
  - Clicar em **Sair**.

- [ ] **Passo 3.2 — Verificação de Limpeza**
  - **Verificação no Navegador:** A tela deve retornar imediatamente ao formulário limpo de identificação inicial.
  - **Verificação no Storage:** A chave `fluy:cliente:teste:dispositivo` no `localStorage` deve ter sido removida.
  - Recarregar a página (`F5`). A tela deve continuar no formulário de identificação (sem manter login persistido).

---

### Cenário 4: Rate Limiting de Identificação

- [ ] **Passo 4.1 — Disparo Repetido de Identificação**
  - No formulário de identificação, preencher: Nome `Teste Throttle` e WhatsApp `11999990000`.
  - Submeter o formulário 4 vezes consecutivas em menos de 1 minuto.
  - **Verificação:** Na 4ª tentativa, a interface deve exibir mensagem de erro amigável de limite:
    *"Muitas tentativas de identificação. Aguarde alguns instantes e tente novamente."* (ou *"Você fez muitas tentativas recentemente..."*).
