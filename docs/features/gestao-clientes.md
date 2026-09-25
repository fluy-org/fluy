# Gestão de Clientes e Histórico

## Objetivo

Fornecer ao salão uma visão completa de cada cliente cadastrada — dados básicos, histórico de agendamentos, imagens, anexos, notas, métricas — para acompanhar preferências, evolução, recorrência e recuperar contexto rapidamente antes de cada atendimento.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

### Lista de clientes

- Exibir os clientes cadastrados no salão, com paginação (rolagem infinita).
- Buscar por nome ou WhatsApp.
- Filtrar por segmento (todas, atendidas nos últimos 30 dias, novas nos últimos 30 dias) e por status (ativas, inativas, todas).
- Ordenar por nome (padrão), último atendimento ou maior valor gasto.

### Ficha da cliente

- Exibir e editar dados básicos: nome, WhatsApp (com confirmação — impacta vínculo com UUID), observações livres.
- Exibir timeline paginada do histórico de agendamentos (data, procedimento, valor, status) com link para detalhe, incluindo agendamentos futuros.
- Abrir a ficha de cliente inativa em modo leitura, com opção de reativar.
- Exibir galeria unificada de imagens de referência enviadas pela cliente (via [[anexos]]).
- Exibir galeria de anexos internos do salão (via [[anexos]]).
- Exibir notas e observações cronológicas feitas pelo salão (via [[lembretes-internos]] — notas livres sem data).
- Exibir métricas: total gasto acumulado, total de agendamentos, no-shows, cancelamentos, último atendimento.
- Oferecer atalho para criar agendamento manual para a cliente.
- Oferecer atalho para criar nota/lembrete livre associado à cliente.

### Cadastro

- Criar cadastro implicitamente via [[identificacao-cliente]] (fluxo público) ou explicitamente no [[gestao-agendamentos]] (fluxo manual pelo salão).
- Reutilizar cadastro existente pelo WhatsApp em qualquer criação.
- Normalizar WhatsApp (formato internacional) no armazenamento.

## Documentos de referência

- fluxos/salao/11-clientes-historico.md
- fluxos/cliente/01-primeiro-acesso.md (criação de cadastro pela cliente)
- fluxos/salao/05-agendamento-manual.md (criação de cadastro pelo salão)

## Dependências

Depende de:
- [[identificacao-cliente]] (fluxo público que gera/reutiliza cadastros)
- [[gestao-agendamentos]] (histórico é composto pelos agendamentos)
- [[anexos]] (galerias de imagens)
- [[lembretes-internos]] (notas cronológicas)
- [[faturamento]] (métrica de total gasto)

Usado por:
- [[gestao-agendamentos]] (seleção de cliente na criação manual)
- [[agenda-do-dia]] (link do card para a ficha)
- [[lembretes-internos]] (notas na ficha)

## Observações

- **Cadastro é específico ao salão** (multi-tenant) — uma pessoa com 2 salões tem 2 cadastros.
- **WhatsApp é a chave única** dentro de um salão.
- **Editar WhatsApp** exige confirmação; as sessões do dispositivo seguem o cadastro e continuam reconhecendo a cliente.
- **Histórico é imutável** — não permite editar/apagar agendamentos passados (auditoria).
- **Métricas** podem ser calculadas em tempo real ou com cache curto.
- **Merge de cadastros duplicados** (mesma pessoa, WhatsApp digitado diferente) está fora do MVP mas é demanda esperada cedo. Ver PENDENCIAS.md item 6.
- **Direito à exclusão (LGPD)** e política de retenção estão fora do MVP mas precisam entrar cedo. Ver PENDENCIAS.md item 3.
- **Tags/categorias, aniversário, exportação CSV** estão fora do MVP — observações livres cobrem casos simples.
- **Salão apagar cliente** é a inativação (soft delete em `removido_em`), que preserva o histórico.
