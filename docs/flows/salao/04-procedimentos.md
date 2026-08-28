# Salão — Cadastro e gestão de procedimentos

## Objetivo

Permitir que o salão mantenha seu catálogo de procedimentos (serviços oferecidos), incluindo dados essenciais para cálculo de agenda, cobrança e apresentação à cliente.

## Passo a passo

### Criar procedimento

1. Salão acessa "Procedimentos" no painel.
2. Clica em "Novo procedimento".
3. Preenche:
   - **Nome** (obrigatório)
   - **Duração estimada** em minutos (obrigatório; inclui buffer de preparação/limpeza)
   - **Preço** (obrigatório)
   - **Sinal** (obrigatório): percentual OU valor fixo
   - **Descrição** (opcional; visível para a cliente)
   - **Informações pré-procedimento** (opcional; exibidas à cliente na confirmação, não no catálogo)
   - **Imagem** (opcional; visível para a cliente; entra na fatia 1.6-BE)
   - **Período de manutenção sugerido** em dias (opcional; usado para criar [lembrete](./12-lembretes.md) automático ao concluir atendimento)
4. Sistema salva; procedimento entra ativo.

### Editar procedimento

1. Salão seleciona um procedimento existente.
2. Altera campos e salva.

### Ativar/Desativar

1. Salão marca um procedimento como **inativo**.
2. Sistema oculta o procedimento da lista para clientes.
3. Agendamentos futuros já existentes desse procedimento **permanecem inalterados** (duração congelada, dados preservados).

## Variações

- **Sucesso criação:** procedimento aparece no catálogo público (se ativo).
- **Sucesso edição:** alterações valem para futuros agendamentos; agendamentos existentes mantêm dados originais (nome/duração/preço congelados no momento do agendamento).
- **Desativação:** procedimento some da vitrine da cliente; salão pode reativar depois.
- **Reativação:** procedimento volta à vitrine.
- **Exclusão dura:** NÃO existe no MVP — só inativação (preserva histórico).

## Regras de negócio

- **Campos obrigatórios no MVP:** nome, duração, preço, sinal.
- **Sinal é configurável por procedimento** — cada um define seu próprio (percentual OU valor fixo).
- **Duração é congelada no momento do agendamento.** Alterações posteriores no catálogo NÃO afetam agendamentos existentes.
- **Preço também é congelado** no momento do agendamento (mesma lógica).
- **Estado ativo/inativo** substitui exclusão. Preserva histórico e permite reativar.
- **Vitrine da cliente:** exibe apenas procedimentos ativos, por ordem de cadastro, do mais antigo ao mais novo.
- **Categoria/agrupamento NÃO entra no MVP** — decisão adiada; catálogo cresce achatado.
- **Máximo 1 imagem por procedimento** no MVP (galeria de várias imagens fora do escopo).
- **Um procedimento por agendamento** no MVP (combos podem ser cadastrados como "Corte+Escova" — um procedimento separado com preço/duração combinados).

## Dependências

- **Onboarding do salão** — cadastro de pelo menos 1 procedimento é obrigatório para setup mínimo.
- **Storage de imagens** — para o campo opcional de foto.
- **Fluxo de agendamento da cliente** — consome o catálogo de procedimentos ativos.
- **Lembretes internos** — usa "período de manutenção sugerido" para criar lembretes automáticos.

## Casos extremos (edge cases)

- **Duração muito curta (ex.: 5min):** aceito, mas pode gerar agenda muito fragmentada.
- **Duração muito longa (ex.: 8h):** aceito; sistema não oferecerá horários que caibam se não houver janela grande.
- **Preço zero:** aceito? MVP: aceitar (procedimento de cortesia); sinal fica zero automaticamente.
- **Sinal maior que preço total:** validação bloqueia.
- **Sinal em percentual > 100%:** validação bloqueia.
- **Nome duplicado no catálogo do mesmo salão:** permitir. A API não emite alerta; a interface pode alertar o salão futuramente.
- **Excluir imagem existente:** procedimento volta a não ter imagem; agendamentos passados perdem referência à imagem (ou copiam?). MVP: aceita perda; agendamentos exibem "sem imagem" retroativamente.
- **Alterar sinal enquanto há agendamento em estado `Reservado`:** o cálculo do valor a pagar foi feito com o sinal antigo; manter o valor antigo até a reserva resolver.

## Dúvidas em aberto

- **Máximo de procedimentos por salão:** limite técnico ou de plano? MVP sem cobrança → sem limite prático.
- **Categorias:** adiado, mas se catálogo crescer muito virá demanda.
- **Procedimentos "com opções" (ex.: manicure com cor à escolha):** fora do MVP; se necessário, cadastrar como procedimentos separados.
- **Cadastrar disponibilidade específica por procedimento** (ex.: "coloração só de segunda a quarta"): fora do MVP; disponibilidade é do salão inteiro.
