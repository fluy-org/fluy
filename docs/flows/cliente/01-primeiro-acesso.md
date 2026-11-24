# Cliente — Primeiro acesso e identificação

## Objetivo

Identificar a cliente em seu primeiro contato com o link de agendamento do salão, sem exigir criação de conta, senha ou login. A identificação serve para: (a) permitir que o salão tenha um cadastro consistente da cliente e (b) reconhecê-la em acessos futuros pelo mesmo dispositivo.

## Passo a passo

1. Cliente abre o link do salão (`nome-do-salao.fluy.app`) pelo navegador do celular.
2. Sistema detecta que não há UUID armazenado (cookie/localStorage).
3. Sistema pede: **Nome** e **WhatsApp**.
4. Cliente preenche e envia.
5. Sistema busca no cadastro do salão se já existe cliente com aquele WhatsApp:
   - Se **existe** — associa o UUID novo ao cadastro existente com status **não-verificado** (`verificada_em = null`) e armazena o `nome_informado` fornecido neste dispositivo. O histórico passado, dados cadastrados e avisos permanecem protegidos e ocultos deste dispositivo.
   - Se **não existe** — cria novo cadastro com Nome + WhatsApp e marca a sessão como **verificada** (`verificada_em = agora`).
6. Sistema gera um UUID único e armazena localmente no dispositivo (localStorage), enviando nas requisições subsequentes via cabeçalho HTTP `x-cliente-credencial`.
7. Cliente segue para o fluxo de agendamento propriamente dito.

## Variações

- **Sucesso (novo cadastro):** cliente inédita naquele salão — cadastro criado, sessão verificada, UUID armazenado, avança.
- **Sucesso (retorno como WhatsApp existente em novo dispositivo):** cadastro reutilizado com sessão não-verificada; novo UUID associado, nome digitado salvo como nome informado na sessão sem alterar o nome original cadastrado, avança para agendamento sem expor dados anteriores.
- **Erro de validação:** WhatsApp em formato inválido — sistema pede correção.
- **Limite de tentativas excedido (Rate limit):** mais de 5 tentativas por IP ou 3 por WhatsApp em 1 minuto — sistema bloqueia temporariamente com mensagem amigável.
- **Cliente ignora e fecha o navegador:** sem UUID gerado, sem cadastro criado; próximo acesso reinicia.

## Regras de negócio

- **Sem login, sem senha, sem conta.** A identificação é implícita via UUID no dispositivo.
- **WhatsApp é a chave principal de identificação da cliente no cadastro do salão.** Dois acessos com o mesmo WhatsApp resultam em um único cadastro.
- **Um cadastro pode ter múltiplos UUIDs associados** (ex.: cliente acessa do celular pessoal e do trabalho → dois UUIDs, mesmo cadastro, unificados por WhatsApp).
- **Cada salão tem sua base de clientes independente** (multi-tenant). A cliente é do salão, não do Fluy.
- **Nome é editável em cada acesso** (ver [retorno](./02-retorno.md)) — cliente pode agendar como outra pessoa reutilizando o dispositivo.

## Dependências

- **Onboarding do salão** — precisa que o salão exista e tenha URL ativa (subdomínio provisionado).
- **Fluxo de criação de agendamento** — este fluxo entrega a cliente identificada para o próximo passo.

## Casos extremos (edge cases)

- **Cliente limpa cookies/localStorage entre acessos:** perde o UUID; próximo acesso é tratado como "primeiro acesso". Se ela informar o mesmo WhatsApp, o cadastro é reutilizado — não perde histórico.
- **Cliente muda de número de WhatsApp:** vira um cadastro novo. O salão pode consolidar manualmente pelo painel se identificar (ver fluxo de gestão de clientes do salão).
- **Cliente compartilha o dispositivo com terceiros:** UUID armazenado pertence à última identificação. Ver fluxo [retorno](./02-retorno.md) para "agendar como outra pessoa".
- **Múltiplas abas abertas simultaneamente pelo mesmo dispositivo:** UUID lido em cada aba; se cliente estava identificada, todas as abas veem a mesma identidade.
- **Modo anônimo/privado:** localStorage é efêmero; próxima sessão reinicia. Comportamento aceito.
- **Falha de rede após envio dos dados:** salão pode não ter recebido o cadastro; próximo acesso valida via WhatsApp e reconstrói se necessário.

## Dúvidas em aberto

- **Validação de WhatsApp:** só validação de formato (regex) ou algum tipo de confirmação (envio de código)? No MVP a decisão é "só formato" — mas se aparecerem cadastros com WhatsApp inventado, pode virar problema (agendamentos "fantasma").
- **Idioma/localização:** sistema assume português-BR; se salão atender turistas ou público estrangeiro, precisa i18n? Fora do MVP.
- **Consentimento LGPD:** salão está coletando nome e telefone de terceiros; precisa aviso de política de privacidade? Recomendado incluir link mínimo.
