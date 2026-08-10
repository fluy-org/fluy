# Features do MVP — Plataforma de Organização de Conteúdo Musical

Este documento é um **índice das funcionalidades do MVP**. Cada feature apresenta apenas: objetivo, fluxo resumido, principais responsabilidades e dependências. Detalhes de regras de negócio, validações, casos de borda, estrutura de banco, APIs, componentes e interface serão definidos no planejamento individual de cada feature.

**Contexto:** ver [Idea.md](Idea.md) para a ideia da plataforma e [DOMAIN_MODEL.md](DOMAIN_MODEL.md) para o modelo de domínio.

As features estão listadas na **ordem de implementação recomendada**. A ordem prioriza pré-requisitos técnicos (dados antes de comportamentos, comportamentos antes de organização) e entrega incremental de valor.

---

## 1. Cadastro de Músicas

**Objetivo:** Permitir que o usuário construa a biblioteca de músicas da plataforma — a base de todo o restante do sistema.

**Fluxo resumido:**
1. Usuário acessa a Biblioteca de Músicas.
2. Cria uma nova música informando os dados básicos (nome, letra, observações, álbum).
3. Escolhe um álbum existente ou cria um novo álbum no mesmo fluxo (informando nome e capa).
4. Salva. A música passa a fazer parte da biblioteca.
5. Pode editar ou excluir músicas existentes.

**Principais responsabilidades:**
- Manter a biblioteca de músicas.
- Gerenciar álbuns (criar, associar músicas, definir capa) de forma embutida no cadastro de música.
- Listar as músicas cadastradas para consulta.

**Dependências:** Nenhuma. É a fundação do sistema.

---

## 2. Upload de Áudio

**Objetivo:** Anexar o arquivo de áudio a uma música cadastrada, para que ela possa ser reproduzida na plataforma.

**Fluxo resumido:**
1. Usuário abre uma música da biblioteca.
2. Faz upload de um arquivo de áudio.
3. O áudio fica associado à música e disponível para reprodução dentro da plataforma.
4. Pode substituir ou remover o áudio depois.

**Principais responsabilidades:**
- Receber e armazenar o arquivo de áudio.
- Vincular o áudio à música correspondente.
- Servir o áudio pela própria plataforma (sem redirecionamento externo).

**Dependências:** [1. Cadastro de Músicas](#1-cadastro-de-músicas).

---

## 3. Player Integrado

**Objetivo:** Reproduzir qualquer música da biblioteca em qualquer tela onde ela apareça, sem tirar o usuário do contexto atual.

**Fluxo resumido:**
1. Em qualquer tela que exiba uma música com áudio, o usuário clica em play.
2. O player inicia a reprodução e permanece disponível enquanto o usuário navega.
3. Usuário pode pausar, avançar e controlar a reprodução.

**Principais responsabilidades:**
- Reproduzir o áudio de uma música em qualquer contexto da aplicação.
- Manter estado de reprodução consistente durante a navegação.
- Ser reutilizável por outras features que precisem tocar áudio (trecho, tela principal, etc.).

**Dependências:** [2. Upload de Áudio](#2-upload-de-áudio).

---

## 4. Cadastro de Conteúdos

**Objetivo:** Permitir que o usuário capture ideias de divulgação em um único lugar, antes de decidir qual música usar.

**Fluxo resumido:**
1. Usuário acessa a Biblioteca de Conteúdos.
2. Cria um novo conteúdo informando título, descrição, links de referência e notas.
3. Salva. O conteúdo passa a fazer parte da biblioteca.
4. Pode editar ou excluir conteúdos existentes.

**Principais responsabilidades:**
- Manter a biblioteca de conteúdos.
- Centralizar todas as ideias de publicação, independentemente da música.
- Listar os conteúdos cadastrados para consulta.

**Dependências:** Nenhuma. Independente das músicas.

---

## 5. Relacionamento entre Conteúdos e Músicas

**Objetivo:** Conectar um conteúdo a uma música, criando uma **ideia** — a unidade concreta de gravação que aparecerá na Tela Principal.

**Fluxo resumido:**
1. Usuário abre um conteúdo.
2. Visualiza a biblioteca de músicas.
3. Seleciona uma ou mais músicas para associar ao conteúdo.
4. Cada associação cria uma nova ideia (conteúdo + música).
5. Pode desvincular uma música do conteúdo a qualquer momento.

**Principais responsabilidades:**
- Criar e remover ideias (associações entre conteúdo e música).
- Suportar múltiplas ideias por conteúdo (o mesmo conteúdo pode virar várias publicações, com músicas diferentes).
- Servir de base para as features que operam sobre ideias (trecho, status, fila, progresso).

**Dependências:** [1. Cadastro de Músicas](#1-cadastro-de-músicas), [4. Cadastro de Conteúdos](#4-cadastro-de-conteúdos).

---

## 6. Seleção Visual do Trecho

**Objetivo:** Definir visualmente qual pedaço da música será usado em uma ideia, sem preenchimento manual de tempo.

**Fluxo resumido:**
1. Usuário abre uma ideia.
2. Reproduz o áudio da música.
3. Seleciona visualmente sobre a waveform o início e o fim do trecho desejado.
4. Salva o trecho na ideia.
5. Pode ajustar ou refazer o trecho a qualquer momento.

**Principais responsabilidades:**
- Renderizar a waveform da música.
- Capturar a seleção visual de início/fim.
- Persistir o trecho na ideia correspondente.

**Dependências:** [3. Player Integrado](#3-player-integrado), [5. Relacionamento entre Conteúdos e Músicas](#5-relacionamento-entre-conteúdos-e-músicas).

---

## 7. Reprodução do Trecho Salvo

**Objetivo:** Tocar apenas o trecho definido na ideia, para que o usuário ouça exatamente o que vai gravar.

**Fluxo resumido:**
1. Em uma ideia que já tem trecho definido, o usuário clica em play.
2. O player toca apenas o intervalo salvo (início até fim do trecho).
3. Ao final do trecho, a reprodução para automaticamente.

**Principais responsabilidades:**
- Limitar a reprodução aos limites do trecho salvo.
- Reutilizar o player integrado com as fronteiras do trecho aplicadas.

**Dependências:** [3. Player Integrado](#3-player-integrado), [6. Seleção Visual do Trecho](#6-seleção-visual-do-trecho).

---

## 8. Download do Trecho

**Objetivo:** Exportar o trecho selecionado como um arquivo de áudio, para uso na gravação do conteúdo.

**Fluxo resumido:**
1. Em uma ideia que já tem trecho definido, o usuário aciona o download.
2. A plataforma gera e entrega o arquivo do trecho.

**Principais responsabilidades:**
- Recortar o áudio nos limites do trecho definido.
- Entregar o arquivo resultante ao usuário.

**Dependências:** [6. Seleção Visual do Trecho](#6-seleção-visual-do-trecho).

---

## 9. Duplicação de Conteúdos

**Objetivo:** Reaproveitar rapidamente uma ideia de conteúdo já criada, para variá-la com outra música e outro trecho.

**Fluxo resumido:**
1. Usuário escolhe um conteúdo existente e aciona "duplicar".
2. Um novo conteúdo é criado com os mesmos campos do original (título, descrição, links, notas), mas **sem** as ideias associadas.
3. Usuário associa novas músicas e trechos ao novo conteúdo.

**Principais responsabilidades:**
- Criar um novo conteúdo copiando apenas os campos do conteúdo original.
- Deixar o novo conteúdo pronto para receber novas associações.

**Dependências:** [4. Cadastro de Conteúdos](#4-cadastro-de-conteúdos).

---

## 10. Controle de Status (Publicado / Não publicado)

**Objetivo:** Registrar quais ideias já viraram publicações e quais ainda estão pendentes.

**Fluxo resumido:**
1. Toda ideia começa como "não publicada".
2. Após gravar/publicar, o usuário marca a ideia como "publicada".
3. Pode reverter o status se precisar.

**Principais responsabilidades:**
- Manter o estado de publicação de cada ideia.
- Expor esse estado para outras features (fila, progresso, tela principal).

**Dependências:** [5. Relacionamento entre Conteúdos e Músicas](#5-relacionamento-entre-conteúdos-e-músicas).

---

## 11. Organização Manual da Fila

**Objetivo:** Permitir que o usuário reordene manualmente as ideias na Tela Principal, ajustando a fila de gravação conforme prioridade, clima ou disponibilidade do momento.

**Fluxo resumido:**
1. Usuário abre a Tela Principal.
2. Vê as ideias organizadas em uma fila ordenada.
3. Arrasta e solta uma ideia para uma nova posição.
4. A nova ordem é persistida imediatamente.

**Principais responsabilidades:**
- Exibir as ideias em ordem.
- Suportar drag-and-drop para reordenação.
- Persistir a nova posição.

**Dependências:** [5. Relacionamento entre Conteúdos e Músicas](#5-relacionamento-entre-conteúdos-e-músicas).

---

## 12. Contador de Progresso

**Objetivo:** Mostrar rapidamente o quanto de conteúdo já foi publicado e o quanto ainda falta.

**Fluxo resumido:**
1. Em uma área visível da plataforma (por exemplo, na Tela Principal), o usuário vê um resumo com:
   - Total de ideias
   - Ideias publicadas
   - Ideias restantes
2. Os números refletem em tempo real o estado das ideias.

**Principais responsabilidades:**
- Calcular e exibir os totais agregados de ideias.
- Refletir mudanças de status assim que ocorrerem.

**Dependências:** [5. Relacionamento entre Conteúdos e Músicas](#5-relacionamento-entre-conteúdos-e-músicas), [10. Controle de Status](#10-controle-de-status-publicado--não-publicado).

---

## Sobre a Tela Principal

A "Tela Principal" descrita no [Idea.md](Idea.md) não é uma feature independente — ela é o **cenário de execução** onde as features [7](#7-reprodução-do-trecho-salvo), [8](#8-download-do-trecho), [10](#10-controle-de-status-publicado--não-publicado), [11](#11-organização-manual-da-fila) e [12](#12-contador-de-progresso) se manifestam. Cada uma dessas features contribui com uma parte da Tela Principal. O design e a montagem da tela serão definidos junto com a implementação dessas features.
