# Salão — Onboarding e setup inicial

## Objetivo

Permitir que um novo salão se cadastre no Fluy de forma self-service, configure o mínimo necessário para começar a receber agendamentos e obtenha a URL pública para compartilhar com suas clientes.

## Pré-condição de identidade

Antes do onboarding, a pessoa cria a conta no Clerk, confirma o e-mail por
link e o frontend chama `POST /usuarios` com o Bearer token da sessão ativa.
Esse endpoint cria apenas o `usuario` global; ele não cria um salão. Se o
cadastro local foi interrompido, o frontend consulta `GET /usuarios/eu` e
repete o POST idempotente quando receber `404`. Quando a conta existir, o
estado `sem-salao` direciona ao onboarding e `com-salao` direciona ao painel.

## Passo a passo

1. Pessoa acessa a landing do Fluy.
2. Clica em "Criar conta" / "Começar grátis".
3. Clerk coleta nome, sobrenome, e-mail e credencial pelo provedor escolhido.
4. Pessoa confirma o e-mail por link e retorna com uma sessão Clerk ativa.
5. Frontend exibe a conclusão de cadastro e chama `POST /usuarios` com o
   Bearer token. O backend materializa somente a conta global `usuario`.
6. Depois da criação ou consulta bem-sucedida da conta global, o frontend
   direciona para o onboarding do salão.
7. Sistema pede as **informações do salão** (setup mínimo — passo obrigatório):
   - Nome do salão
   - Contato (telefone/WhatsApp)
   - Endereço
   - Subdomínio desejado (`nome-do-salao.fluy.app`) — sistema valida disponibilidade
8. Backend cria, em uma transação, o `salao`, a membership `usuario_salao` com
   papel de dono, a `configuracao_salao` com defaults e o `profissional` inicial.
9. Sistema provisiona o subdomínio.
10. Sistema conduz o dono para configurar **pelo menos 1 procedimento**:
   - Nome, duração, preço (obrigatórios)
   - Sinal (percentual ou fixo)
   - Descrição, imagem (opcionais)
11. A configuração de disponibilidade fica disponível no painel após a criação
    do salão; ela não integra a conclusão do onboarding.
12. Demais configurações **assumem defaults sensatos** e ficam disponíveis para ajuste posterior:
   - Granularidade: 30min
   - Prazo de reserva sem pagamento: 15min
   - Tolerância de atraso: 15min
   - Antecedência mínima: 2h
   - Antecedência máxima: 60 dias
   - Informações pré-procedimento, mensagem personalizada: vazios (opcional editar)
13. Onboarding concluído — sistema exibe a URL pública do salão para compartilhar.
14. Salão pode explorar demais configurações no painel a qualquer momento.

## Variações

- **Sucesso, salão criado:** URL ativa; o salão só recebe agendamentos quando
  concluir os requisitos mínimos de procedimento e disponibilidade.
- **Login com Google:** Clerk cria a sessão; após a confirmação exigida pelo
  provedor, segue para a conclusão da conta global e depois para os dados do salão.
- **Subdomínio já em uso:** sistema pede outro; sugere variações (nome + cidade, nome + numero).
- **Dono abandona no meio do setup:** conta e salão já existem; ao voltar,
  o login direciona ao painel. A conclusão do setup permanece disponível nele.
- **Setup mínimo incompleto:** URL do salão pode existir mas mostra "salão em configuração" para clientes que acessarem.
- **Email já cadastrado:** Clerk oferece login ou recuperação de acesso conforme
  sua configuração.

## Regras de negócio

- **Requisitos mínimos obrigatórios** antes de o salão poder receber agendamentos:
  1. Dados do salão (nome, contato, endereço)
  2. Pelo menos 1 procedimento ativo
  3. Pelo menos 1 janela de disponibilidade
- A validação técnica desses requisitos entra com o fluxo de agendamento no
  Bloco 2.
- **Subdomínio é único no Fluy** — first-come, first-served.
- **Formato do subdomínio:** apenas letras minúsculas, números, hífen. Sem acento ou espaço.
- **A UX do MVP foca em um salão por vez.** O modelo permite múltiplas
  memberships para o mesmo `usuario`; troca de salão fica fora deste fluxo.
- **Autenticação e confirmação de e-mail são responsabilidade do Clerk.**
- **Verificação do telefone/WhatsApp é opcional no MVP.**
- **Cobrança do SaaS** não existe no MVP — decisão adiada; salão usa gratuitamente.
- **Modelagem já preparada para multi-usuário** no salão (dono + funcionários com papéis), mas UI de convite/gestão só entra em versão futura.

## Dependências

- **Provisionamento de subdomínio wildcard SSL** (infra).
- **Clerk** configurado com os provedores de login escolhidos.
- **Modelagem de tenants** (isolamento de dados entre salões).

## Casos extremos (edge cases)

- **Concorrência de subdomínio:** dois usuários tentam registrar o mesmo subdomínio ao mesmo tempo. Segundo recebe erro e escolhe outro.
- **Dono cria conta com email de outro salão:** vira conta pessoal do usuário; salão criado é dele, não do outro salão. (Sem transferência de propriedade no MVP.)
- **Provedor de login falha ou não retorna e-mail verificável:** Clerk interrompe
  o cadastro; o frontend não cria a conta local.
- **Dono não configura janela padrão:** salão não aceita agendamentos, mas fica "criado" no sistema; a janela é configurada posteriormente no painel.
- **Dono desativa todos os procedimentos:** URL pública exibe "sem procedimentos disponíveis"; clientes não conseguem agendar.
- **Ataque/spam de cadastros falsos:** sem cobrança, precisa considerar CAPTCHA e/ou verificação de email.
- **Subdomínio com termo ofensivo/proibido:** precisa lista de palavras bloqueadas ou moderação. Fora do MVP.

## Dúvidas em aberto

- **Trial gratuito x freemium x pago:** decisão adiada — MVP sem cobrança.
- **Dado do salão para nota fiscal (CNPJ, razão social):** entra no onboarding ou depois quando começar a cobrar? Fora do MVP.
- **Wizard vs formulário único no setup:** UX pura — não desenhamos aqui.
- **Salão pode "pausar" a conta temporariamente (viagens, licença)?** Não previsto no MVP; adicionar depois se demanda aparecer.
