# Roteiro de Teste do Navegador: FLY-005

**Tarefa:** FLY-005 — Confiabilidade do pagamento online: prazo, confirmação e avisos  
**Objetivo:** Validar visualmente o comportamento da rota pública de retorno de pagamento (`/retorno-pagamento`), tanto em navegador diferente (sem `localStorage`, simulando redirecionamento do banco ao sair do WhatsApp) quanto no mesmo navegador, garantindo que a cliente tenha orientação clara sem erros técnicos, e validar a recepção dos avisos ao salão.

---

## 1. Dados & Contas de Teste (Banco Local)

- **Salão de Teste:**
  - Nome: `teste`
  - Subdomínio: `teste`
  - ID: `3c94b9db-9d7e-4a5d-a55a-affbde3d0b19`
- **Cliente de Teste:**
  - Nome: `Rudney cliente`
  - WhatsApp: `11999999999`
- **Procedimento com Pagamento Online:**
  - Nome: `Corte e Escova` (ou similar)
  - Preço: R$ 100,00 | Sinal: R$ 25,00

---

## 2. Cenário A: Retorno do Banco em Navegador Diferente (sem localStorage)

Simula o caso crítico onde a cliente iniciou a reserva no navegador interno do WhatsApp e o aplicativo bancário a devolveu para o navegador padrão do celular (Chrome / Safari), onde o `localStorage` está limpo.

### URL Alvo
`http://localhost:4200/retorno-pagamento?identificadorPagamento=fake-cobranca-teste`  
*(Substitua `fake-cobranca-teste` pelo identificador externo de uma cobrança confirmada ou execute com uma guia anônima).*

### Passo a Passo Visual
1. Abra uma **guia anônima** (ou limpe os cookies e o LocalStorage para simular um navegador virgem).
2. Acesse a URL: `http://localhost:4200/retorno-pagamento?identificadorPagamento=fake-cobranca-teste`.
3. Observe a tela de carregamento:
   - Deve exibir brevemente o indicador de carregamento (*"Localizando sua reserva..."*).
4. Ao concluir a busca no backend pelo identificador retornado pelo banco:
   - A tela renderiza o status da reserva diretamente, **SEM** navegar para `/checkout/:id` (o que causaria erro de "Identificação ausente").
   - Confirme visualmente:
     - Título em destaque: **"Pagamento confirmado!"** (para pagamento já liquidado) ou **"Pagamento em processamento"** (se pendente).
     - Nome do procedimento (ex: `Corte e Escova`).
     - Nome do salão (ex: `teste`).
     - Texto orientador: *"Você pode acompanhar todos os detalhes na conversa do WhatsApp com o salão."*
     - Botão de ação: **"Ver salão [Nome]"**, com link para a página do salão (`/s/teste`).
   - Confirme que a cliente **NÃO** é redirecionada para a tela de login de proprietários (`/login`).

### Checklist Visual (Cenário A)
- [ ] O carregamento inicial exibe o texto amigável "Localizando sua reserva...".
- [ ] A tela exibe o card de status diretamente na página, sem tentar abrir checkout com credencial vazia.
- [ ] O procedimento e o nome do salão são identificados corretamente.
- [ ] Há um botão claro para visitar a página do salão (`/s/:subdominio`).
- [ ] Não há redirecionamento para tela de login administrativo do sistema (`/login`).

---

## 3. Cenário B: Retorno do Banco no Mesmo Navegador (com localStorage)

Simula a cliente que fez o checkout no navegador padrão e retornou para o mesmo navegador após autorizar o Pix.

### URL Alvo
`http://localhost:4200/s/teste` → Fluxo de checkout até `/retorno-pagamento`.

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste` e inicie uma reserva de procedimento com sinal online.
2. Avance para a tela de checkout (`/s/teste/checkout/:id`).
3. Em outra aba ou simulando o retorno bancário no mesmo navegador, navegue para:
   `http://localhost:4200/retorno-pagamento`.
4. Observe o redirecionamento automático:
   - Como há exatamente 1 reserva ativa salva no `localStorage` deste navegador, a página exibe o spinner com a mensagem *"Redirecionando de volta para a sua reserva..."*.
   - A página redireciona automaticamente para `/s/teste/checkout/:id`.
   - Na tela de checkout, o polling de consulta monitora e atualiza a situação do pagamento.

### Checklist Visual (Cenário B)
- [ ] Com 1 reserva no LocalStorage, o redirecionamento para a tela de checkout é automático.
- [ ] A tela de checkout carrega normalmente com a identificação e o cronômetro preservados.

---

## 4. Cenário C: Acesso à Página de Retorno sem Dados (Fallback Amigável)

Simula quando a página `/retorno-pagamento` é aberta diretamente sem query param e sem nenhuma reserva em andamento.

### URL Alvo
`http://localhost:4200/retorno-pagamento` (em guia anônima).

### Passo a Passo Visual
1. Em uma guia anônima sem parâmetros na URL, acesse `http://localhost:4200/retorno-pagamento`.
2. Verifique a área de alerta exibida:
   - Título/destaque: **"Abra o link do salão para ver o seu agendamento."**
   - Mensagem explicativa: *"Não encontramos uma reserva neste navegador. Se você autorizou o pagamento no aplicativo do seu banco, o salão já recebeu a confirmação. Reabra a conversa no WhatsApp para ver os detalhes do seu agendamento."*
   - Verifique que **NÃO** existe botão apontando para a raiz `/` (login de donos de salão).

### Checklist Visual (Cenário C)
- [ ] Exibe instrução clara para a cliente reabrir o WhatsApp.
- [ ] Não exibe telas de erro quebrado ou links para área restrita do sistema.

---

## 5. Cenário D: Avisos ao Salão de Pagamento Confirmado e Tardio

Validação no painel administrativo do salão de que os eventos de pagamento geram avisos para a equipe.

### URL Alvo
`http://localhost:4200/painel/avisos` (ou central de notificações do salão `teste`).

### Passo a Passo Visual
1. No painel do salão `teste`, abra a central de notificações ou lista de avisos.
2. Após a confirmação de um pagamento online no prazo:
   - Localize o aviso com tipo/título: **"Agendamento pago confirmado"**.
   - Verifique o texto informando o nome da cliente, o procedimento e a data/horário formatada no fuso local.
3. Se um pagamento for autorizado após a reserva ter expirado:
   - Localize o aviso com título: **"Pagamento recebido após o prazo"**.
   - Verifique a mensagem orientando a ação manual: *"Pagamento recebido para a reserva expirada de [Cliente] ([Procedimento]). Combine o encaixe ou realize o estorno."*

### Checklist Visual (Cenário D)
- [ ] O salão recebe o aviso "Agendamento pago confirmado" ao concluir o Pix.
- [ ] O salão recebe o aviso "Pagamento recebido após o prazo" com orientação clara de encaixe ou estorno se a reserva expirou antes da liquidação.
