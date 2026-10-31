# Temas visuais do painel

O painel acompanha a preferência de aparência do aparelho por
`prefers-color-scheme`: claro ou escuro. As cores ficam centralizadas em
`frontend/src/theme/variables.scss`; componentes usam os tokens do Fluy.

O tema claro usa superfícies brancas, texto azul profundo e destaques rosa e
violeta. O escuro usa superfícies azul-violeta, texto claro e os mesmos acentos.
Agenda e resumo financeiro compartilham o destaque em degradê. Estados mantêm
seus rótulos para não depender somente de cor.

## Verificação manual

- Abrir Agenda, Procedimentos, Clientes e Faturamento em 390 × 844 px.
- Alternar a preferência de cores do aparelho ou a emulação do navegador.
- Conferir cabeçalho, menus, filtros, cartões, estados vazios e formulários.
- Conferir texto longo, rolagem até a última ação e ausência de corte horizontal.
- Repetir em desktop, mantendo as tabelas e filtros existentes.

As quatro páginas principais compartilham navegação inferior no celular,
agora também disponível em Lembretes, com cinco destinos fixos para não
trocar a posição dos atalhos entre páginas. A navegação usa
ícones acima dos rótulos e indicação da seção atual. A barra participa do
layout e não sobrepõe o conteúdo. As outras funções seguem acessíveis no menu.

A agenda oferece cinco datas em torno do dia selecionado, além do calendário
mensal. Continua mostrando somente os atendimentos de um dia, sem grade
semanal. Encerrados aparecem compactos; valores completos ficam no detalhe.

Clientes usam iniciais e status. Procedimentos mantêm edição e ativação no
menu de ações de cada cartão. Faturamento reúne os indicadores em um cartão
e apresenta recebimentos por método antes dos atendimentos.

## Formulários e configurações

Novo agendamento, Novo procedimento, Disponibilidade e Configurações usam
cabeçalho com retorno e logo centralizada, cartões compactos e os mesmos
tokens dos temas. Agendamento mantém as etapas recolhíveis e a seleção real
de clientes; procedimento mantém upload, remoção da imagem e todos os campos.
As ações desses dois formulários ficam fora da rolagem, sem cobrir o conteúdo.

Disponibilidade mostra um resumo por dia e permite expandir a edição dos
intervalos. Ativar um dia abre sua edição. Alterações e cópia para o próximo
dia continuam dependendo da ação Salvar. Configurações mantém o link público
e todas as regras existentes.

- Verificar as quatro telas em ambos os temas, no celular e desktop.
- Conferir retorno, seleção e troca de cliente, etapas e envio do agendamento.
- Conferir imagem, validação e salvamento de procedimento no modal.
- Conferir múltiplos intervalos, ativação de dias, cópia e salvamento.
- Conferir cópia do link, campos de configuração e mensagens de validação.

## Lista de lembretes e refinamentos

Lembretes apresenta ícone de origem, data, cliente e texto em cartões compactos.
As ações Concluir, Editar e Excluir ficam em uma área expansível. Não existe
estado “Enviado”: a referência visual não altera os estados reais nem cria
envio automático. Os filtros continuam consultando o backend.

Clientes mantém a ordenação disponível em um controle expansível; busca e
segmentação permanecem iguais. Agenda distingue visualmente as reservas dos
agendados e preserva os valores pagos/pendentes. Faturamento mostra ícones por
método e o intervalo compacto no celular, mantendo o ano e o fuso explícitos.

Verificar também teclado nas áreas expansíveis, ações dos lembretes, os cinco
atalhos inferiores, nomes longos e intervalos que atravessam o ano.
