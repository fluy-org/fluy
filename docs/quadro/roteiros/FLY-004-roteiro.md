# Roteiro de Teste do Navegador: FLY-004

**Tarefa:** FLY-004 — Checkout da cliente: tela de pagamento simples e só de pagamento  
**Objetivo:** Validar visualmente a experiência simplificada e focada do checkout de pagamento Pix (Open Finance Efí): resumo compacto de valores ("Pagar agora" vs "No salão"), ausência de seção de imagens no checkout, máscara e validação de CPF (sem corte ao colar com pontuação), busca de bancos com mais usados no topo, botão de ação única principal ("Pagar com Pix no meu banco"), limpeza de jargões técnicos e nova ação de upload de imagens no detalhe de "Meus agendamentos".

---

## 1. Dados & Contas de Teste (Banco Local)

- **Salão de Teste:**
  - Nome: `teste`
  - Subdomínio: `teste`
  - ID: `3c94b9db-9d7e-4a5d-a55a-affbde3d0b19`
- **Cliente de Teste:**
  - Nome: `Rudney cliente`
  - WhatsApp: `11999999999` (ou `+5511999999999`)
- **Procedimento com Pagamento Online (Open Finance):**
  - Nome: `Corte e Escova` (ou procedimento configurado com sinal online)
  - Preço Total: R$ 100,00 a R$ 150,00
  - Sinal: R$ 25,00 a R$ 30,00

---

## 2. Cenário A: Resumo Compacto, Valores Claros e Ausência de Upload no Checkout

### URL Alvo
`http://localhost:4200/s/teste`

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste`.
2. Se necessário, informe o WhatsApp `11999999999` para identificação.
3. Escolha o procedimento com pagamento online e selecione data e horário disponíveis.
4. Na etapa de revisão, avance para o pagamento clicando em **Reservar e ir ao pagamento**.
5. Na tela de **Pagamento da reserva** (`/checkout/:id`):
   - Inspecione o **Card de Resumo**:
     - Confirme que exibe nome do procedimento, salão e endereço de forma compacta.
     - Confirme o cronômetro com tempo restante claro (ex: `Tempo restante para pagar: 14:50 (até 15:15)`).
     - Confirme que **NÃO** aparece a frase *"A validade é conferida pelo servidor."*
     - Confirme os três indicadores de valor:
       - **Procedimento**: Valor total (ex: `R$ 100,00`).
       - **Pagar agora**: Valor do sinal ou total (ex: `R$ 25,00`).
       - **No salão**: Valor restante a pagar presencialmente (ex: `R$ 75,00`).
     - Se o nome do recebedor estiver visível, confirme que exibe apenas o nome (ex: `Recebedor: Fulano da Silva`), sem duplicar *"Recebedor: Recebedor:"*.
6. Inspecione o restante da página:
   - Confirme que **NÃO existe nenhum Card ou bloco de envio de imagens de referência** no checkout.
   - Se houver mensagem do salão ou tolerância de atraso vazias no cadastro, confirme que elas não deixam frases soltas como *"Tolerância: minutos"*.

### Checklist Visual (Cenário A)
- [ ] O resumo da reserva é compacto e não exibe jargões técnicos de servidor.
- [ ] Os valores discriminam claramente "Pagar agora" e "No salão".
- [ ] O rótulo do recebedor não repete a palavra "Recebedor: Recebedor".
- [ ] A tela de checkout não possui nenhuma seção ou card de upload de fotos.

---

## 3. Cenário B: Preenchimento de CPF (Máscara, Pontuação e Validação)

### URL Alvo
Tela de checkout da reserva em andamento (`http://localhost:4200/s/teste/checkout/:id`).

### Passo a Passo Visual
1. No formulário de pagamento, localize o campo **CPF de quem vai pagar**.
2. Cole um CPF já pontuado (ex: `529.982.247-25`):
   - Verifique que o campo aceita todos os 14 caracteres (com pontos e traço) sem truncar os últimos dígitos.
3. Apague o campo e digite apenas números (ex: `51687574219`):
   - Verifique que a máscara `000.000.000-00` é aplicada progressivamente conforme você digita.
4. Digite um CPF matematicamente inválido (ex: `111.111.111-11` ou `123.456.789-00`):
   - Toque no botão de envio ou saia do campo:
   - Verifique a exibição de mensagem de validação amigável (*"Informe um CPF válido"*).
5. Digite um CPF válido (ex: `529.982.247-25`):
   - O aviso de erro desaparece e o campo fica pronto para submissão.

### Checklist Visual (Cenário B)
- [ ] Colar CPF com pontuação não corta os dígitos finais.
- [ ] Digitar CPF aplica formatação visual com pontos e traço.
- [ ] CPFs com dígitos inválidos ou repetidos são criticados antes do envio ao gateway.

---

## 4. Cenário C: Seletor de Banco com Busca e Mais Usados

### URL Alvo
Tela de checkout da reserva em andamento (`http://localhost:4200/s/teste/checkout/:id`).

### Passo a Passo Visual
1. No formulário de pagamento, localize o campo **Banco de quem vai pagar**.
2. Verifique o botão seletor estilizado exibindo *"Selecione o seu banco..."*.
3. Clique ou toque no botão seletor:
   - Um modal é aberto com título *"Selecione o seu banco"* e um campo de busca (`ion-searchbar`).
4. Com a busca vazia:
   - Verifique a seção **Bancos mais usados** no topo, destacando opções populares (ex: Nubank, Banco do Brasil, Bradesco, Itaú, Caixa, Santander, etc.).
   - Verifique a seção **Outros bancos** listando os demais bancos sem duplicações.
5. No campo de busca, digite parte do nome do banco (ex: `nub` ou `itau`):
   - A lista filtra instantaneamente mostrando apenas os bancos correspondentes.
6. Toque no banco desejado (ex: `Nubank`):
   - O modal se fecha automaticamente.
   - O botão seletor no formulário agora exibe o nome do banco selecionado em destaque.
   - Tecnologias assistivas (leitores de tela) anunciam o banco atualmente selecionado.

### Checklist Visual (Cenário C)
- [ ] Toque no seletor de banco abre modal com campo de pesquisa.
- [ ] Os bancos mais usados são destacados no topo.
- [ ] A digitação na barra de busca filtra os bancos em tempo real.
- [ ] Ao escolher um banco, o modal fecha e o nome do banco aparece selecionado no formulário.

---

## 5. Cenário D: Ação Única Principal ("Pagar com Pix no meu banco") e Confirmação

### URL Alvo
Tela de checkout da reserva em andamento (`http://localhost:4200/s/teste/checkout/:id`).

### Passo a Passo Visual
1. Com a modalidade, CPF válido e Banco preenchidos:
   - Inspecione a parte inferior do formulário.
   - Verifique o texto orientativo: *"Você será levada ao app do seu banco para autorizar o Pix com segurança."*
   - Verifique que existe **apenas um botão principal** visível: **Pagar com Pix no meu banco**.
2. Clique em **Pagar com Pix no meu banco**:
   - Um spinner de carregamento indica o processamento.
   - A integração chama o backend para criar a cobrança Pix Open Finance da Efí.
   - Em ambiente com URL do banco retornada, o navegador navega diretamente para a autorização no banco.
3. Se a página for recarregada ou retornar com status pendente:
   - A tela exibe os detalhes canônicos do pagamento (Recebedor, Modalidade traduzida para "Sinal" ou "Valor total", Valor e Total a autorizar).
   - O botão principal exibe **Autorizar no banco**.
   - As ações secundárias discretas são **Consultar situação** e **Escolher outro horário**.
4. Após o pagamento ser confirmado:
   - A tela atualiza para o bloco de sucesso verde: *"Agendamento confirmado!"*
   - Exibe a nota de quanto resta pagar no salão (se foi pago sinal).
   - Se cadastradas no salão, exibe a política de tolerância de atraso e mensagem do salão.
   - Botão principal único: **Adicionar ao calendário**.
   - Botão de navegação: link **Voltar ao salão** no cabeçalho.

### Checklist Visual (Cenário D)
- [ ] No máximo um botão de ação principal visível por estado da tela.
- [ ] O texto orienta que a autorização acontecerá no ambiente bancário.
- [ ] A modalidade é exibida como "Sinal" ou "Valor total" (sem nomes técnicos crus).
- [ ] Após confirmação, a tela exibe o status de sucesso com opção de calendário.

---

## 6. Cenário E: Envio de Imagens de Referência pelo Detalhe de "Meus Agendamentos"

### URL Alvo
`http://localhost:4200/s/teste` -> Meus agendamentos

### Passo a Passo Visual
1. Acesse `http://localhost:4200/s/teste`.
2. Abra o menu ou aba **Meus agendamentos**.
3. Clique em um agendamento com status reservado ou agendado para abrir os detalhes.
4. Na tela de detalhe do agendamento, role até a seção **Suas imagens de referência**:
   - Se ainda não houver imagens: exibe *"Nenhuma imagem de referência enviada."*
   - Verifique o botão **Adicionar referência**.
5. Use o teclado (tecla `Tab` e `Enter`/`Space`) para alcançar e acionar o botão de adicionar imagens:
   - Verifique que o seletor abre normalmente (garantido pela técnica `visually-hidden`).
6. Selecione 1 ou 2 imagens (JPEG, PNG ou WebP até 5 MiB):
   - As miniaturas das fotos selecionadas aparecem na tela com botão **Remover**.
   - O botão de ação **Salvar imagens de referência** torna-se visível.
7. Clique em **Salvar imagens de referência**:
   - As fotos são enviadas ao servidor com feedback de carregamento.
   - Ao concluir, as fotos passam a fazer parte da galeria oficial do agendamento.
   - Caso atinja o limite de 3 imagens, o botão de adicionar é desabilitado.

### Checklist Visual (Cenário E)
- [ ] Seção de imagens de referência está localizada nos detalhes do agendamento em "Meus agendamentos".
- [ ] O seletor de arquivos é alcançável e operável via teclado.
- [ ] Validações de tipo (JPEG, PNG, WebP) e tamanho máximo (5 MiB) são respeitadas.
- [ ] Pré-visualização com miniaturas e opção de remover antes de salvar funciona corretamente.
- [ ] Imagens são salvas e persistem nos detalhes do agendamento.
