# Roteiro de Teste do Navegador: FLY-002

**Tarefa:** FLY-002 — Agendar sem pagamento online: salão sem Pix e opção "pagar no salão"  
**Objetivo:** Validar visualmente o fluxo de agendamento quando o salão não possui chave Pix configurada (ou o provedor de pagamento online estiver desativado) e quando o procedimento possui sinal opcional, permitindo a escolha de "Pagar no salão".

---

## 1. Dados & Contas de Teste (Banco Local)

- **Salão de Teste:**
  - Nome: `teste`
  - Subdomínio: `teste`
  - ID: `3c94b9db-9d7e-4a5d-a55a-affbde3d0b19`
- **Cliente Existente:**
  - Nome: `Rudney cliente`
  - WhatsApp: `11999999999` (ou `+5511999999999`)
- **Procedimento com Sinal de Teste:**
  - Nome: `Corte e Escova` (Preço: R$ 150,00 | Sinal: R$ 30,00)
  - Nome alternativo: `procedimento com sinal` (Preço: R$ 10,00 | Sinal: R$ 5,00)

---

## 2. Cenário A: Salão sem Pagamento Online (Fluxo "Pagar no Salão" Automático)

### URL Alvo
`http://localhost:4200/s/teste`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste`.
2. Se a tela de identificação for exibida:
   - Digite o WhatsApp `11999999999`.
   - Clique em **Continuar** / **Entrar**.
3. Na tela de catálogo de procedimentos:
   - Localize o card do procedimento `Corte e Escova` (ou `procedimento com sinal`).
   - Verifique que a tag informativa exibe `Sinal: R$ 30,00 (pago no salão)` caso o salão não possua Pix configurado.
   - Clique no procedimento para selecioná-lo e clique em **Escolher data e horário**.
4. Na tela de escolha de horário:
   - Selecione o primeiro dia disponível do calendário.
   - Selecione um horário livre (ex: `10:00`).
   - Clique em **Revisar agendamento**.
5. Na tela de confirmação de agendamento:
   - Verifique o resumo de informações: procedimento, data, horário, local e valor total.
   - Observe o aviso de pagamento destacado: *"Este salão não recebe pagamentos online. O valor do procedimento será pago diretamente no salão no momento do atendimento."*
   - Verifique o botão de ação principal: o texto deve ser **Confirmar agendamento (pagar no salão)**.
   - Clique em **Confirmar agendamento (pagar no salão)**.
6. Após a confirmação:
   - O agendamento deve ser criado diretamente no estado **Agendado** (sem redirecionar para tela de pagamento/checkout com QR Code Pix).
   - A tela deve exibir a mensagem de confirmação de sucesso com as orientações do atendimento.
7. Acesse a aba/seção **Meus Agendamentos**:
   - Localize o agendamento recém-criado.
   - Clique em **Cancelar**.
   - Verifique o modal de confirmação de cancelamento: deve exibir *"Deseja realmente cancelar este agendamento?"* **SEM** mencionar retenção de sinal (pois nenhum sinal online foi pago).

### Checklist Visual (Cenário A)
- [ ] No catálogo, procedimento com sinal exibe tag contextualizada (`pago no salão`).
- [ ] Na tela de confirmação, banner informativo esclarece que o pagamento é presencial no salão.
- [ ] Botão exibe o rótulo "Confirmar agendamento (pagar no salão)".
- [ ] Não há redirecionamento para geração de Pix nem trava de espera de webhook.
- [ ] O agendamento é concluído e listado com sucesso.
- [ ] No modal de cancelamento, não é exibida mensagem de retenção de sinal.

---

## 3. Cenário B: Procedimento com Sinal Opcional (Escolha da Cliente)

### URL Alvo
`http://localhost:4200/painel/procedimentos` (Painel Administrativo) e `http://localhost:4200/s/teste` (Portal da Cliente)

### Passo a Passo Visual
1. Acesse o painel de procedimentos em `http://localhost:4200/painel/procedimentos`.
2. Edite ou crie um procedimento com sinal e selecione **Política do sinal: Opcional (cliente pode pagar no salão)**.
3. Salve o procedimento.
4. Acesse o portal da cliente em `http://localhost:4200/s/teste`.
5. Selecione o procedimento com política opcional, escolha um horário e avance para a confirmação.
6. Na tela de confirmação:
   - Observe a seção **Como deseja pagar?**.
   - Verifique as duas opções selecionáveis:
     * **Pagar sinal online agora** (com destaque do valor e aviso de CPF/banco).
     * **Pagar no salão no dia do atendimento** (sem pagamento antecipado).
   - Alterne a seleção para **Pagar no salão no dia do atendimento**.
   - Verifique que o botão muda dinamicamente para **Confirmar agendamento (pagar no salão)**.
   - Clique em **Confirmar agendamento (pagar no salão)**.
7. Confirme a criação imediata como agendado.
8. Acesse o Painel do Salão em `http://localhost:4200/painel/agenda`:
   - Abra o detalhe do agendamento criado.
   - Na seção de valores, confirme a indicação: **Cobrança: No salão**.

### Checklist Visual (Cenário B)
- [ ] Formulário de procedimentos no painel permite selecionar "Obrigatório" ou "Opcional".
- [ ] Na tela de confirmação pública, as opções de pagamento via radio button respondem ao clique e ao teclado (Enter/Espaço sem scroll).
- [ ] Ao marcar "Pagar no salão", o agendamento é finalizado sem cobrança online prévia.
- [ ] No detalhe do agendamento da agenda (`detalhe-agendamento`), o campo "Cobrança: No salão" é exibido com clareza para a profissional.
