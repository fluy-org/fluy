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
- Diferenciar sessões verificadas e não-verificadas para proteção de dados (LGPD): novo dispositivo informando WhatsApp já existente cria sessão não-verificada.
- Proteger dados da cliente em sessões não-verificadas: nome cadastrado, histórico anterior, fotos de referência e avisos nunca são expostos.
- Isolar agendamentos criados por sessões não-verificadas (`sessao_cliente_id`): visíveis e canceláveis somente pela sessão que os criou.
- Controle de ciclo de vida da sessão: expiração deslizante (90 dias) e revogação no servidor (`DELETE /publico/s/:subdominio/cliente/sessao`) ao sair ou agendar como outra pessoa.
- Tráfego seguro da credencial via cabeçalho HTTP `x-cliente-credencial`.
- Rate limiting dedicado para identificação (por IP e por WhatsApp).
- Recuperação de acesso completo através de link mágico gerado pelo salão na ficha da cliente e enviado via WhatsApp.

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
- **Sessão verificada vs não-verificada:** Quando um cliente inédito se cadastra, sua sessão original é verificada. Quando um novo dispositivo informa um WhatsApp existente, a sessão nasce não-verificada (`verificada_em = null`) para impedir vazamento de dados privados ou cancelamentos não autorizados.
- **Isolamento de agendamentos:** Agendamentos guardam a sessão que os gerou (`sessao_cliente_id`). Em sessões não-verificadas, apenas agendamentos criados pela própria sessão são listados ou canceláveis.
- **Expiração e revogação:** As sessões têm validade de 90 dias renovadas a cada requisição. Clicar em "Sair" ou "Agendar como outra pessoa" revoga a sessão no backend e limpa o armazenamento local.
- **Recuperação de acesso:** Link mágico gerado pelo salão na ficha da cliente e enviado via WhatsApp (`wa.me`). Ver PENDENCIAS.md itens 5 e 7.
- **Consentimento LGPD:** Coleta de consentimento no primeiro acesso da cliente. Ver PENDENCIAS.md item 3.
