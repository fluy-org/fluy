# Salão — Gestão de clientes e histórico

## Objetivo

Fornecer ao salão uma visão completa de cada cliente — dados básicos, histórico de agendamentos, imagens de referência, anexos internos, notas e observações — para acompanhar preferências, evolução e recorrência.

## Passo a passo (lista de clientes)

1. Salão acessa a aba "Clientes".
2. Sistema exibe a lista de clientes ativas do salão, paginada (rolagem infinita), ordenada por nome (A–Z).
3. Salão pode:
   - Buscar por nome (sem diferenciar acento nem maiúscula) ou WhatsApp.
   - Filtrar por segmento: todas, atendidas nos últimos 30 dias (atendimento concluído com início nos últimos 30 dias) ou novas (cadastradas nos últimos 30 dias).
   - Filtrar por status: ativas, inativas ou todas.
   - Ordenar por nome (padrão), último atendimento (mais recente primeiro) ou maior valor gasto ("VIP" é esta ordenação, não um filtro com corte).
   - Tocar em uma cliente para abrir a ficha. Cada item mostra nome, WhatsApp, último atendimento e se está inativa.

## Passo a passo (ficha da cliente)

Ao abrir uma cliente, o salão vê:

1. **Dados básicos** (editáveis pelo salão):
   - Nome
   - WhatsApp (chave, editar com cuidado — ver dúvidas)
   - Observações livres (texto amplo — preferências, alergias, etc.)
2. **Histórico de agendamentos** (timeline, paginado, do mais recente para o mais antigo):
   - Todos os agendamentos da cliente, inclusive os futuros, com o estado atual (`Agendado`, `Concluído`, `Cancelado`, `No-show`)
   - Data, procedimento, preço total congelado
   - Link para o detalhe do agendamento (com imagens/notas)
3. **Galeria de imagens de referência** enviadas pela cliente ao longo do tempo (todas as imagens de todos os agendamentos, unificadas).
4. **Galeria de anexos internos** adicionados pelo salão (fotos de resultado, uso interno; até 3 por agendamento).
5. **Notas/observações** feitas pelo salão sobre ela (todas ao longo do tempo, cronológicas).
6. **Métricas** (regras em [domain/faturamento.md](../../domain/faturamento.md#métricas-derivadas-da-ficha-da-cliente)):
   - Total gasto acumulado (mesma regra do total faturado: o que efetivamente entrou)
   - Total de agendamentos
   - No-shows / cancelamentos
   - Último atendimento
7. **Ações**:
   - Criar agendamento manual para essa cliente (atalho para [agendamento manual](./05-agendamento-manual.md))
   - Criar nota/lembrete livre associado à cliente (ver [lembretes](./12-lembretes.md))
   - Editar dados básicos
   - Inativar / reativar a cliente
   - (Fora do MVP) Mesclar cadastros duplicados

## Variações

- **Cliente que só se cadastrou mas nunca agendou:** aparece na lista com histórico vazio e métricas zeradas; a ficha oferece o atalho de criar agendamento.
- **Cliente inativa:** a ficha abre em modo leitura (dados, métricas e histórico); edição e criação de agendamento ficam bloqueadas até reativar.
- **Cliente com histórico enorme:** paginação/lazy loading para não travar UI.
- **Cliente sem imagens/notas:** seções aparecem vazias.
- **Cliente que apareceu duas vezes com WhatsApp diferente (por engano):** dois cadastros; salão pode notar e pedir mesclagem (fora do MVP).

## Regras de negócio

- **Cadastro de cliente é específico ao salão** (multi-tenant) — uma pessoa que agenda em 2 salões tem 2 cadastros independentes.
- **WhatsApp é a chave única** dentro de um mesmo salão.
- **Edição de WhatsApp** exige confirmação, porque o WhatsApp é a chave única da cliente no salão. As sessões do dispositivo (`sessao_cliente`) apontam para o cadastro, não para o WhatsApp: continuam reconhecendo a mesma cliente, agora com o número novo.
- **Histórico é imutável** — não permite editar/apagar agendamentos passados (auditoria).
- **Anexos do salão são apenas para o salão ver** (não vazam para a cliente).
- **Imagens da cliente são visíveis para ambos** (cliente enviou; salão vê no atendimento e na ficha).
- **Métricas são calculadas em tempo real** ou com cache curto (dado sensível a variar por segundos).

## Dependências

- **Fluxo de identificação da cliente** (cria/reutiliza cadastros).
- **Fluxo de criação de agendamento** (alimenta o histórico).
- **Fluxo de conclusão/cancelamento/no-show** (marca o estado do histórico).
- **Sistema de anexos** (imagens da cliente e do salão).
- **Sistema de notas/lembretes** (nota livre).
- **Faturamento** (métrica de total gasto).

## Casos extremos (edge cases)

- **Cliente pediu para excluir dados (LGPD):** MVP não tem fluxo automatizado; salão trata via suporte / admin apaga. Precisa política.
- **Salão apaga cliente:** a remoção é a inativação (soft delete em `cliente.removido_em`); o histórico de agendamentos permanece para faturamento e a cliente pode ser reativada.
- **Dois cadastros da mesma pessoa** (WhatsApp digitado diferente): salão vê como duas clientes; fluxo de merge fora do MVP.
- **Cliente muda de nome oficialmente** (casamento, mudança social): salão edita nome; histórico mantém referência sem repetir dados antigos.
- **Cliente com histórico gigante** (10+ anos, 500+ agendamentos): performance de listagem.
- **Salão exporta lista de clientes** (para marketing próprio): fora do MVP; considerar LGPD.
- **WhatsApp em formato internacional (+55...):** normalizar armazenamento.

## Dúvidas em aberto

- **Merge de cadastros duplicados:** feature útil; fora do MVP mas cedo demanda.
- **Tags/categorias de clientes** (VIP, alérgica, recorrente): fora do MVP; observações livres cobrem por enquanto.
- **Aniversário da cliente:** salões costumam mandar mensagem; salão pode registrar no campo observações no MVP. Feature dedicada fora do MVP.
- **Exportar CSV** de clientes: fora do MVP; considerar LGPD/consentimento.
- **LGPD:** política clara de retenção, direito de exclusão, portabilidade. Fora do MVP mas precisa entrar cedo.
