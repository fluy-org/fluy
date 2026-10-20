# Convites administrativos de proprietários

O Clerk é a fonte de verdade para emissão, expiração, revogação e aceitação das
Application Invitations. O Fluy não cria nem atualiza registros em
`convite_proprietario` neste fluxo. A tabela antiga permanece somente para
preservar histórico e autorizações já existentes.

Após a aceitação, o backend valida o perfil diretamente na API do Clerk e cria
somente a autorização permanente necessária para o proprietário criar salão.

## Garantias do fluxo

- não existe endpoint HTTP de emissão ou revogação;
- o comando usa `notify: false` e o link é enviado manualmente pelo WhatsApp;
- a metadata de proprietário é criada exclusivamente pelo backend;
- a metadata contém versão, referência aleatória e assinatura HMAC do e-mail;
- convite comum, metadata ausente/malformada ou e-mail divergente não autoriza;
- usuário, identidade e autorização são gravados na mesma transação;
- a referência é única e locks transacionais impedem consumo concorrente;
- `POST /saloes` continua exigindo uma autorização permanente, inclusive quando
  a exigência global de convite está desabilitada.

O `publicMetadata` da Application Invitation é copiado pelo Clerk para o usuário
quando o cadastro pelo ticket é concluído. Essa transferência é a evidência
usada pelo Fluy; a simples presença de `__clerk_ticket` no navegador nunca
autoriza a API.

## Variáveis de ambiente

O comando carrega a configuração validada do backend. Portanto, execute-o em um
ambiente administrativo que já possua as variáveis obrigatórias da API. Para o
fluxo de convite, estas são as variáveis específicas:

- `CLERK_SECRET_KEY`: chave secreta da mesma instância Clerk do frontend;
- `OWNER_INVITE_REDIRECT_URL`: `http://localhost:4200/convite` em ambiente
  local ou `https://fluy-agendamentos.netlify.app/convite` em produção;
- `OWNER_INVITE_METADATA_SECRET`: segredo aleatório exclusivo, com pelo menos
  32 caracteres, igual no processo do comando e na API;
- `OWNER_INVITE_DEFAULT_EXPIRATION_DAYS`: opcional, entre 1 e 30; padrão 7.

Não reutilize `CLERK_SECRET_KEY` como segredo de metadata. Não versione o valor
real e não o exponha ao frontend. Trocar `OWNER_INVITE_METADATA_SECRET` invalida
a materialização de autorizações de convites ainda não processados.

Quando `OWNER_INVITE_ENFORCEMENT_ENABLED=true`, a API se recusa a iniciar sem
`OWNER_INVITE_METADATA_SECRET`.

## Compilar

Na raiz do monorepo:

```bash
npm run build:schema
npm run build --workspace=backend
```

O comando executa JavaScript compilado em `backend/dist`.

## Emitir

```bash
npm run convite:proprietario --workspace=backend -- emitir --email pessoa@example.com --dias 7
```

`--dias` é opcional. A saída mostra o ID do Clerk, a expiração e o link uma única
vez. Copie o link e envie manualmente pelo WhatsApp. Não cole a saída em logs,
tickets ou canais públicos.

O Clerk impede convites ativos duplicados porque a emissão usa
`ignoreExisting: false`. Se uma resposta for interrompida, o comando procura no
Clerk a mesma referência antes de reportar falha. Em falha ambígua, confira as
Application Invitations no Dashboard antes de repetir a emissão.

## Revogar

Use o ID do Clerk (`inv_...`) mostrado na emissão:

```bash
npm run convite:proprietario --workspace=backend -- revogar --id ID_DO_CLERK
```

A revogação ocorre diretamente no Clerk. Não há estado local para sincronizar.
Uma autorização permanente já criada após a aceitação não é removida ao revogar
o convite; qualquer remoção de autorização exige auditoria e operação separada.

## Aceitação e onboarding

1. A pessoa abre o link enviado pelo WhatsApp.
2. O Clerk redireciona para `/convite?__clerk_ticket=...`.
3. O frontend inicia o cadastro com estratégia `ticket`, sem Google e sem troca
   de e-mail, e solicita apenas nome, sobrenome e senha.
4. O Clerk autentica a conta e copia a metadata do convite para o usuário.
5. `/concluir-cadastro` chama `POST /usuarios`.
6. A API consulta o usuário diretamente no Clerk, exige e-mail primário
   verificado e valida versão, referência e assinatura do e-mail.
7. O PostgreSQL materializa usuário, identidade e autorização na mesma
   transação. Repetições são idempotentes.
8. O onboarding existente cria o salão; `POST /saloes` exige a autorização.

Enquanto `OWNER_INVITE_ENFORCEMENT_ENABLED=false`, uma conta nova sem convite
pode ser materializada como usuário durante a transição, mas nunca recebe
`autorizacao_proprietario` e não consegue criar salão. O runtime não cria novas
autorizações de origem `legado`.

## Migração e compatibilidade

A migration `0012_reconciliar_autorizacoes_proprietario.sql` cria ou
reconcilia a autorização por convite do Clerk, inclusive em bancos que já
receberam a sequência anterior de migrations. Ela preserva:

- autorizações legítimas de origem `legado`;
- autorizações antigas ligadas por `convite_id`;
- a tabela e os dados de `convite_proprietario`.

Não execute essa migration automaticamente em produção. Primeiro aplique em
staging, valide o fluxo completo e confira as autorizações existentes.

## Ativação segura

1. configure o mesmo `OWNER_INVITE_METADATA_SECRET` no comando e na API;
2. aplique as migrations até `0012_reconciliar_autorizacoes_proprietario` em
   staging;
3. publique backend e frontend mantendo a flag desabilitada;
4. revogue no Clerk e reemita convites ainda pendentes criados pelo fluxo antigo;
   a metadata antiga não concede autorização no fluxo novo;
5. teste convite válido, convite comum, expirado, revogado, e-mail divergente,
   repetição e duas requisições simultâneas;
6. audite autorizações `legado` potencialmente indevidas;
7. altere o Access mode do Clerk para **Invite-only** para impedir criação de
   contas fora das Application Invitations;
8. somente depois habilite `OWNER_INVITE_ENFORCEMENT_ENABLED=true`.

O modo Invite-only do Clerk e a autorização permanente do Fluy são proteções
complementares: o primeiro restringe a criação da conta; a segunda protege a
criação do salão mesmo contra chamadas diretas à API.
