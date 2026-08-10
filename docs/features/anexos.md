# Anexos

## Objetivo

Permitir upload, armazenamento e exibição controlada de imagens vinculadas a procedimentos, agendamentos e clientes, com regras claras de visibilidade (público vs. interno do salão).

## Usuários envolvidos

- Cliente final (envia imagens de referência ao criar agendamento)
- Salão (visualiza imagens da cliente; envia anexos internos com fotos do resultado; envia imagem de procedimento)

## Capacidades entregues

- Aceitar upload de **imagens de referência da cliente** durante a criação do agendamento (múltiplas, visíveis para ambos: cliente e salão).
- Aceitar upload de **anexos internos do salão** por agendamento (até 3 imagens por agendamento, visíveis apenas para o salão).
- Aceitar **1 imagem opcional por procedimento** no catálogo (visível para a cliente).
- Validar tamanho e formato, comprimir/rejeitar quando exceder limite.
- Consolidar todas as imagens de referência da cliente ao longo do tempo em uma **galeria unificada** na ficha da cliente.
- Consolidar todos os anexos internos do salão em galeria separada na ficha da cliente.
- Preservar imagens em agendamentos passados mesmo quando salão remove imagem do procedimento (comportamento aceito no MVP: agendamentos exibem "sem imagem" retroativamente para imagem de procedimento).

## Documentos de referência

- fluxos/cliente/03-criacao-agendamento.md (upload de imagens de referência)
- fluxos/salao/04-procedimentos.md (imagem do procedimento)
- fluxos/salao/06-agenda-dia.md (indicador e visualização no card)
- fluxos/salao/07-conclusao-atendimento.md (anexos internos ao concluir)
- fluxos/salao/11-clientes-historico.md (galerias na ficha da cliente)

## Dependências

Depende de:
- Storage de imagens (infraestrutura de arquivos / CDN)

Usado por:
- [[gestao-agendamentos]] (imagens de referência acompanham a criação)
- [[gestao-procedimentos]] (imagem opcional do catálogo)
- [[gestao-clientes]] (galerias na ficha)
- [[agenda-do-dia]] (indicadores no card)

## Observações

- **Imagens da cliente** são visíveis para ambos (cliente enviou; salão vê no atendimento e na ficha).
- **Anexos internos do salão** nunca vazam para a cliente.
- Máximo **1 imagem por procedimento** e **3 anexos internos por agendamento** no MVP.
- Sem galeria de várias imagens por procedimento no MVP.
- Limites exatos de tamanho e formato ainda não definidos numericamente.
