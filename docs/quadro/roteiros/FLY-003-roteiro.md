# Roteiro de Teste do Navegador: FLY-003

**Tarefa:** FLY-003 — Reserva pendente e expirada: cancelamento pela cliente, expiração e liberação de horário  
**Objetivo:** Validar visualmente o comportamento completo do ciclo de vida de uma reserva temporária com sinal: cancelamento/desistência explícito pela cliente no checkout ou em "Meus agendamentos", atualização reativa ao expirar o tempo limite, liberação imediata do horário sem erro de duplicidade, card de retomada de pagamento na Home e exibição no histórico de agendamentos.

---

## 1. Dados & Contas de Teste (Banco Local)

- **Salão de Teste:**
  - Nome: `teste`
  - Subdomínio: `teste`
  - ID: `3c94b9db-9d7e-4a5d-a55a-affbde3d0b19`
- **Cliente de Teste:**
  - Nome: `Rudney cliente`
  - WhatsApp: `11999999999` (ou `+5511999999999`)
- **Procedimento com Sinal Obrigatório:**
  - Nome: `Corte e Escova` (Preço: R$ 150,00 | Sinal: R$ 30,00)
  - Política de Sinal: Obrigatório (gera reserva pendente de pagamento Pix)

---

## 2. Cenário A: Desistência e Cancelamento Imediato da Reserva no Checkout

### URL Alvo
`http://localhost:4200/s/teste`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste`.
2. Se a tela de identificação for exibida:
   - Digite o WhatsApp `11999999999` e continue.
3. No catálogo de procedimentos:
   - Clique em **Corte e Escova** (ou procedimento com sinal obrigatório).
   - Clique em **Escolher data e horário**.
4. Selecione uma data e um horário livre (ex: amanhã às `14:00`).
5. Na tela de revisão:
   - Verifique que o valor do sinal é exibido.
   - Clique em **Continuar para o pagamento**.
6. Na tela de Checkout / Pagamento Pix:
   - Verifique que o QR Code Pix e o botão "Copiar código Pix" estão visíveis.
   - Verifique a presença do cronômetro regressivo de validade da reserva (ex: `14:59...`).
   - Localize abaixo das instruções de pagamento o botão de texto/outline **Desistir da reserva**.
   - Clique em **Desistir da reserva**.
7. Verifique o bloco/diálogo de confirmação de desistência exibido em tela:
   - Título: *"Desistir da reserva?"*
   - Texto informativo: *"O horário reservado será liberado imediatamente para outras clientes."*
   - Botões: **Manter reserva** e **Sim, desistir**.
8. Clique em **Sim, desistir**:
   - A aplicação deve processar o cancelamento da reserva e redirecionar a cliente para a página inicial do salão (`/s/teste`).
9. Na página inicial (`/s/teste`):
   - Confirme que **NÃO** há card ou banner de "Reserva aguardando pagamento" no topo.
10. Inicie um novo agendamento com o mesmo procedimento para o mesmo dia e horário:
    - O horário anteriormente reservado deve estar **visível e selecionável** no seletor de horários.
    - Avance para a confirmação: a reserva deve ser criada com sucesso, **sem** apresentar o erro de bloqueio de duplicidade (*"Você já possui este procedimento agendado neste dia"*).

### Checklist Visual (Cenário A)
- [ ] Botão "Desistir da reserva" está visível e acessível na tela de checkout Pix.
- [ ] Ao clicar em desistir, surge confirmação explicando que o horário será liberado imediatamente.
- [ ] Ao confirmar a desistência, a cliente é redirecionada de volta à Home do salão sem erros.
- [ ] O card de retomar pagamento não é exibido na Home após o descarte.
- [ ] O mesmo horário é liberado imediatamente na grade de horários disponíveis.
- [ ] Uma nova reserva para o mesmo procedimento e dia pode ser criada sem erro de duplicidade.

---

## 3. Cenário B: Expiração da Reserva com Contagem Regressiva Zerada

### URL Alvo
`http://localhost:4200/s/teste`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste`.
2. Inicie uma nova reserva para um procedimento com sinal e avance até a tela de Checkout com o Pix gerado.
3. Observe o contador regressivo na tela.
4. Quando a contagem regressiva chegar a zero (ou quando o backend marcar a reserva como expirada/cancelada):
   - A tela de checkout atualiza automaticamente o estado para **Reserva expirada**.
   - A mensagem deve informar: *"Esta reserva expirou porque o pagamento não foi confirmado dentro do prazo de tolerância."*
   - O QR Code Pix e o código copia-e-cola são ocultados/desativados para impedir pagamentos fora do prazo.
   - O botão principal exibe **Escolher outro horário**.
5. Clique em **Escolher outro horário**:
   - A cliente é levada de volta à seleção de catálogo/horários.
6. Na Home do salão:
   - O card de alerta "Você tem uma reserva aguardando pagamento" não reaparece para essa reserva expirada.

### Checklist Visual (Cenário B)
- [ ] O contador regressivo decrementa os segundos corretamente.
- [ ] Ao zerar o prazo, a tela transiciona para o estado "Reserva expirada" sem recarregar a página forçadamente.
- [ ] Código Pix e QR Code são removidos da visualização para proteger a cliente de transferências tardias.
- [ ] Botão de ação permite navegar diretamente para escolha de um novo horário.
- [ ] O contexto local da reserva é limpo do armazenamento, sem travamento de reservas futuras.

---

## 4. Cenário C: Acompanhamento em "Meus Agendamentos" e Desistência

### URL Alvo
`http://localhost:4200/s/teste` -> aba **Meus Agendamentos**

### Passo a Passo Visual
1. Com uma reserva temporária recém-criada (sem ter pago o Pix):
   - Na página inicial do salão (`http://localhost:4200/s/teste`), confirme a presença do card de destaque no topo: *"Reserva aguardando pagamento"* com botão **Pagar agora**.
2. Clique no ícone de menu ou navegação e abra a seção **Meus agendamentos**.
3. Na lista de agendamentos:
   - Localize o card da reserva recém-criada.
   - Verifique que o badge exibe o status **Reservado** (cor primária/destaque).
   - Verifique o texto complementar: *"Expira às HH:mm"*.
4. Clique no card para abrir o detalhe do agendamento:
   - Na linha de destaque, verifique a informação *"Prazo para pagamento: DD/MM/AAAA, HH:mm"*.
   - Verifique o botão **Pagar reserva**: ao clicar, redireciona diretamente de volta ao checkout Pix daquela reserva.
   - Volte ao detalhe e clique em **Desistir da reserva**.
   - Confirme no diálogo de confirmação.
5. Após o cancelamento da reserva:
   - O status no detalhe ou na lista é atualizado para cancelado.
   - Ao retornar para a página inicial, o card de alerta de retomada de pagamento foi removido.
6. Histórico de reservas expiradas ou pagas após o prazo:
   - Para reservas expiradas pelo sistema: o badge exibe **Reserva expirada** em tom neutro e o card oferece a opção *"Escolher novo horário"*.
   - Para reservas com sinal pago após a expiração (`confirmado_apos_expiracao`): o badge exibe em tom de aviso **Pago após o prazo** com instruções e o botão verde com ícone do WhatsApp **Falar com o salão**.

### Checklist Visual (Cenário C)
- [ ] Card de retorno de pagamento na Home é exibido apenas enquanto a reserva estiver ativa e pertencer à cliente conectada.
- [ ] Na lista de "Meus Agendamentos", o horário limite de expiração é formatado no fuso horário do salão.
- [ ] O botão "Pagar reserva" no detalhe do agendamento reabre a tela de checkout com o Pix correto.
- [ ] O botão "Desistir da reserva" em "Meus Agendamentos" cancela a reserva com segurança e limpa o atalho da Home.
- [ ] Reservas expiradas exibem badge "Reserva expirada" com botão para novo agendamento.
- [ ] Reservas com pagamento tardio exibem badge "Pago após o prazo" e botão funcional para falar com o salão no WhatsApp.
