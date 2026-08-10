# Salão — Onboarding e setup inicial

## Objetivo

Permitir que um novo salão se cadastre no Fluy de forma self-service, configure o mínimo necessário para começar a receber agendamentos e obtenha a URL pública para compartilhar com suas clientes.

## Passo a passo

1. Dono do salão acessa a landing do Fluy.
2. Clica em "Criar conta" / "Começar grátis".
3. Sistema pede: nome do dono, email, senha (OU login com Google).
4. Sistema cria a conta do usuário e o "salão-vazio" associado.
5. Sistema pede as **informações do salão** (setup mínimo — passo obrigatório):
   - Nome do salão
   - Contato (telefone/WhatsApp)
   - Endereço
   - Subdomínio desejado (`nome-do-salao.fluy.app`) — sistema valida disponibilidade
6. Sistema provisiona o subdomínio.
7. Sistema conduz o dono para configurar **pelo menos 1 procedimento**:
   - Nome, duração, preço (obrigatórios)
   - Sinal (percentual ou fixo)
   - Descrição, imagem (opcionais)
8. Sistema conduz para configurar **janela de disponibilidade padrão** (template semanal):
   - Para cada dia da semana: uma ou mais janelas (ex.: seg-sex 09:00-18:00) OU "sem atendimento"
9. Demais configurações **assumem defaults sensatos** e ficam disponíveis para ajuste posterior:
   - Granularidade: 30min
   - Prazo de reserva sem pagamento: 15min
   - Tolerância de atraso: 15min
   - Antecedência mínima: 2h
   - Antecedência máxima: 60 dias
   - Informações pré-procedimento, mensagem personalizada: vazios (opcional editar)
10. Setup mínimo concluído — sistema exibe a URL pública do salão para compartilhar.
11. Salão pode explorar demais configurações no painel a qualquer momento.

## Variações

- **Sucesso, salão pronto:** URL ativa, aceita agendamentos.
- **Login com Google:** pula criação de senha; segue direto para dados do salão.
- **Subdomínio já em uso:** sistema pede outro; sugere variações (nome + cidade, nome + numero).
- **Dono abandona no meio do setup:** conta criada mas salão incompleto; ao voltar, cai na etapa faltante.
- **Setup mínimo incompleto:** URL do salão pode existir mas mostra "salão em configuração" para clientes que acessarem.
- **Email já cadastrado:** sistema informa e oferece login/recuperação de senha.

## Regras de negócio

- **Setup mínimo obrigatório** antes de o salão poder receber agendamentos:
  1. Dados do salão (nome, contato, endereço)
  2. Pelo menos 1 procedimento ativo
  3. Pelo menos 1 janela de disponibilidade
- **Subdomínio é único no Fluy** — first-come, first-served.
- **Formato do subdomínio:** apenas letras minúsculas, números, hífen. Sem acento ou espaço.
- **Um usuário pode ter só 1 salão no MVP.** Multi-salão para o mesmo dono fora do MVP.
- **Aceita conta com email+senha OU Google OAuth** (ambos suportados).
- **Cobrança do SaaS** não existe no MVP — decisão adiada; salão usa gratuitamente.
- **Modelagem já preparada para multi-usuário** no salão (dono + funcionários com papéis), mas UI de convite/gestão só entra em versão futura.

## Dependências

- **Provisionamento de subdomínio wildcard SSL** (infra).
- **Sistema de autenticação** (email+senha + Google OAuth).
- **Modelagem de tenants** (isolamento de dados entre salões).

## Casos extremos (edge cases)

- **Concorrência de subdomínio:** dois usuários tentam registrar o mesmo subdomínio ao mesmo tempo. Segundo recebe erro e escolhe outro.
- **Dono cria conta com email de outro salão:** vira conta pessoal do usuário; salão criado é dele, não do outro salão. (Sem transferência de propriedade no MVP.)
- **Google OAuth falha (sem email fornecido, revoke)**: sistema orienta para email+senha.
- **Dono não configura janela padrão:** salão não aceita agendamentos, mas fica "criado" no sistema.
- **Dono desativa todos os procedimentos:** URL pública exibe "sem procedimentos disponíveis"; clientes não conseguem agendar.
- **Ataque/spam de cadastros falsos:** sem cobrança, precisa considerar CAPTCHA e/ou verificação de email.
- **Subdomínio com termo ofensivo/proibido:** precisa lista de palavras bloqueadas ou moderação. Fora do MVP.

## Dúvidas em aberto

- **Verificação de email/telefone durante onboarding:** obrigatório ou opcional? MVP: recomendo verificação de email (magic link ou código) para evitar spam.
- **Trial gratuito x freemium x pago:** decisão adiada — MVP sem cobrança.
- **Dado do salão para nota fiscal (CNPJ, razão social):** entra no onboarding ou depois quando começar a cobrar? Fora do MVP.
- **Wizard vs formulário único no setup:** UX pura — não desenhamos aqui.
- **Salão pode "pausar" a conta temporariamente (viagens, licença)?** Não previsto no MVP; adicionar depois se demanda aparecer.
