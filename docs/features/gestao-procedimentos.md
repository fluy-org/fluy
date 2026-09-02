# Gestão de Procedimentos

## Objetivo

Manter o catálogo de serviços oferecidos pelo salão, com os dados essenciais para cálculo de agenda, cobrança, apresentação à cliente e automações pós-atendimento.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

- Criar procedimento com: nome, duração estimada (min), preço, sinal (percentual ou fixo).
- Adicionar informações opcionais ao procedimento: descrição, informações pré-procedimento e período de manutenção sugerido (dias).
- Associar uma imagem opcional ao criar ou editar o procedimento por `imagem.arquivo_id`.
- Substituir a imagem ao informar outro arquivo e removê-la por comando dedicado.
- Expor a imagem por URL pública direta no catálogo, inclusive quando o procedimento estiver inativo.
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

### Imagem do procedimento

- O arquivo associado precisa pertencer ao mesmo salão do procedimento.
- Remover a imagem elimina apenas o vínculo; o arquivo órfão é removido posteriormente pela limpeza de anexos.

- Um procedimento por agendamento no MVP. Combos são cadastrados como procedimento único (ex.: "Corte + Escova").
- Categorias/agrupamento estão fora do MVP — catálogo cresce achatado.
- A vitrine da cliente exibe os procedimentos ativos por ordem de cadastro, do mais antigo ao mais novo.
- Máximo 1 imagem por procedimento no MVP.
- Alterações no catálogo não afetam agendamentos já existentes (valores congelados).
