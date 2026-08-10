# Identificação da Cliente

## Objetivo

Reconhecer a cliente que acessa o link público do salão, sem exigir criação de conta, senha ou login, mantendo continuidade de identidade entre acessos pelo mesmo dispositivo e consolidando cadastros pelo WhatsApp no salão correspondente.

## Usuários envolvidos

- Cliente final (visitante do link do salão)
- Salão (indiretamente — recebe/reutiliza cadastros gerados)

## Capacidades entregues

- Detectar ausência de identificação no primeiro acesso e coletar Nome + WhatsApp.
- Gerar UUID único por dispositivo e armazenar localmente (cookie / localStorage), específico ao subdomínio do salão.
- Buscar cadastro existente no salão pelo WhatsApp e reutilizá-lo (associando o novo UUID) OU criar novo cadastro.
- Reconhecer cliente em acessos subsequentes lendo o UUID e resolvendo o cadastro associado.
- Oferecer, no retorno, a opção "Continuar como [Nome]" ou "Agendar como outra pessoa".
- Ao "agendar como outra pessoa", reescrever o UUID do dispositivo para a nova identidade e reutilizar cadastro por WhatsApp se já existir.
- Tratar UUID inválido / cadastro removido como primeiro acesso.
- Suportar múltiplos UUIDs apontando para o mesmo cadastro (cliente acessa de vários dispositivos, mesmo WhatsApp).
- Validar formato de WhatsApp na entrada.

## Documentos de referência

- fluxos/cliente/01-primeiro-acesso.md
- fluxos/cliente/02-retorno.md

## Dependências

Depende de:
- [[conta-e-autenticacao]] (o salão precisa existir e ter subdomínio ativo)
- [[gestao-clientes]] (cadastros são gravados na base do salão)

Usado por:
- [[gestao-agendamentos]] (todo agendamento pela cliente exige identificação prévia)
- [[notificacoes]] (para saber o destinatário no dispositivo)

## Observações

- **Sem login, sem senha, sem conta.** Identificação é implícita via UUID no dispositivo.
- **WhatsApp é a chave única de cliente por salão.** Dois acessos com o mesmo WhatsApp resultam em um único cadastro.
- **Cada salão tem sua base de clientes independente** (multi-tenant). A cliente é do salão, não do Fluy.
- UUID armazenado é específico ao salão (subdomínio) — uma cliente que agenda em 2 salões tem 2 UUIDs distintos.
- Recuperação de acesso quando cliente perde UUID (cookies limpos) está fora do MVP — solução atual é falar com o salão via WhatsApp. Ver PENDENCIAS.md item 5.
- Validação de WhatsApp por código enviado está fora do MVP — MVP aceita WhatsApp inventado. Ver PENDENCIAS.md item 7.
- Consentimento LGPD (política de privacidade no primeiro acesso) precisa entrar cedo. Ver PENDENCIAS.md item 3.
