# Cliente — Retorno (cliente reconhecida)

## Objetivo

Reconhecer automaticamente a cliente em acessos posteriores pelo mesmo dispositivo, evitando pedir Nome + WhatsApp de novo, e permitir que ela agende como si mesma OU como outra pessoa (ex.: mãe, amiga, filha) sem sair da experiência.

## Passo a passo

1. Cliente abre o link do salão pelo navegador.
2. Sistema lê o UUID armazenado localmente (cookie/localStorage).
3. Sistema consulta o cadastro associado ao UUID no salão daquele subdomínio.
4. Sistema exibe mensagem de reconhecimento (ex.: "Olá, Maria!") e oferece opções:
   - **Continuar como Maria** — segue para o fluxo de agendamento identificada como Maria.
   - **Agendar como outra pessoa** — pede novo Nome + WhatsApp e segue o fluxo de [primeiro acesso](./01-primeiro-acesso.md) para essa nova identidade.

## Variações

- **Sucesso, cliente segue como ela mesma:** avança direto para agendamento.
- **Sucesso, cliente escolhe outra pessoa:** cai no fluxo de primeiro acesso; após identificar, o UUID armazenado no dispositivo passa a apontar para a nova identidade (a antiga fica no cadastro do salão, mas o dispositivo agora "é" a nova pessoa).
- **UUID inválido/desconhecido:** ex.: cliente clicou em link de outro salão anteriormente, UUID não existe neste salão. Trata como primeiro acesso.
- **Cadastro removido pelo salão:** o UUID aponta para cadastro que não existe mais. Trata como primeiro acesso.

## Regras de negócio

- O UUID armazenado é **específico ao salão** (subdomínio). Cliente que acessa 2 salões terá 2 UUIDs distintos, um por salão.
- **Ao "agendar como outra pessoa", o UUID do dispositivo é reescrito** para a nova identidade. A cliente anterior "some" daquele dispositivo (mas o cadastro dela no salão permanece).
- **WhatsApp** continua sendo a chave única no cadastro; se a "outra pessoa" tiver WhatsApp já existente, reutiliza o cadastro existente.

## Dependências

- **Primeiro acesso** — este fluxo depende de a cliente já ter passado por lá pelo menos uma vez.
- **Gestão de clientes do salão** — se salão remove/edita cliente, este fluxo precisa lidar com UUIDs órfãos.

## Casos extremos (edge cases)

- **Cliente compartilha dispositivo com terceiros:** quem usar por último "domina" o UUID; próxima pessoa precisa clicar "agendar como outra pessoa".
- **Cliente esquece que o dispositivo está "logado" como outra pessoa:** confunde-se ao ver "Olá, Ana!" quando esperava seu próprio nome. Mitigado por a mensagem sempre convidar "não é você? Agendar como outra pessoa".
- **Dispositivo em modo anônimo:** UUID não persiste; volta ao primeiro acesso a cada sessão.
- **Cadastro foi mesclado pelo salão** (dois cadastros da mesma pessoa unificados): o UUID pode apontar para o cadastro "descartado". Precisa tratar redirect ao cadastro sobrevivente.
- **Cliente muda o nome no cadastro do salão:** próximo acesso mostra o nome atual, não o antigo.

## Dúvidas em aberto

- **Múltiplas identidades salvas por dispositivo:** vale permitir "trocar entre identidades salvas" (ex.: uma mãe agenda pra si e pra 2 filhas)? MVP escolhe "não" — quem quiser troca via "agendar como outra pessoa" e re-informa dados. Se virar caso comum, evoluir.
- **Tempo de expiração do UUID:** cookie/localStorage tem vida infinita por padrão. Precisa expirar após X meses de inatividade? Fora do MVP.
