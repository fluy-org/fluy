# Gestão de Procedimentos

## Objetivo

Manter o catálogo de serviços oferecidos pelo salão, com os dados essenciais para cálculo de agenda, cobrança, apresentação à cliente e automações pós-atendimento.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

- Criar procedimento com: nome, duração estimada (min), preço, sinal (percentual ou fixo).
- Adicionar informações opcionais ao procedimento: descrição, imagem, período de manutenção sugerido (dias).
- Editar procedimento existente.
- Ativar / desativar procedimento (soft — não há exclusão dura).
- Ocultar procedimento inativo da vitrine pública da cliente, mantendo-o disponível para agendamento manual pelo salão.
- Preservar dados congelados nos agendamentos existentes quando salão altera o catálogo (nome/duração/preço/sinal do momento do agendamento permanecem).
- Aceitar preço zero (procedimento de cortesia).
- Bloquear configurações inválidas (sinal > preço, sinal percentual > 100%, etc.).

## Documentos de referência

- fluxos/salao/04-procedimentos.md
- fluxos/salao/01-onboarding.md (pelo menos 1 procedimento é obrigatório no setup mínimo)
- fluxos/cliente/03-criacao-agendamento.md (consumo do catálogo ativo pela cliente)
- fluxos/salao/05-agendamento-manual.md (consumo do catálogo, incluindo inativos)

## Dependências

Depende de:
- [[conta-e-autenticacao]]
- [[anexos]] (imagem opcional do procedimento)

Usado por:
- [[gestao-agendamentos]]
- [[lembretes-internos]] (período de manutenção dispara criação automática de lembrete ao concluir atendimento)
- [[pagamentos]] (sinal por procedimento)

## Observações

- Um procedimento por agendamento no MVP. Combos são cadastrados como procedimento único (ex.: "Corte + Escova").
- Categorias/agrupamento estão fora do MVP — catálogo cresce achatado.
- Ordem de exibição na vitrine da cliente ainda não está decidida (ver PENDENCIAS.md).
- Máximo 1 imagem por procedimento no MVP.
- Alterações no catálogo não afetam agendamentos já existentes (valores congelados).
