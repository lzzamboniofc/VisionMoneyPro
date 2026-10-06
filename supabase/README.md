# Banco de dados — VisionMoneyPro

> Estado: **preparado no repositório, não aplicado em nenhum banco**.

O arquivo `schema.sql` é o desenho inicial do banco comercial do VisionMoneyPro. Ele foi pensado para um projeto Supabase exclusivo e não deve ser executado no banco pessoal do A_Dois.

## Modelo de isolamento

A unidade principal é a `workspace`.

- `individual`: uma pessoa usando o produto sozinha.
- `shared`: duas ou mais pessoas compartilhando a mesma vida financeira.
- Todo dado financeiro possui `workspace_id`.
- O vínculo usuário ↔ workspace fica em `workspace_members`.
- As políticas RLS verificam esse vínculo antes de permitir leitura ou escrita.

## Tabelas públicas

- `profiles`
- `workspaces`
- `workspace_members`
- `categories`
- `credit_cards`
- `expenses`
- `incomes`
- `payables`
- `category_budgets`
- `goals`
- `goal_contributions`
- `recurring_transactions`

## Área privada

O schema `private` contém dados que não devem ficar expostos pela Data API:

- `workspace_invites`
- `subscriptions`
- `admin_users`
- `audit_events`

O frontend não recebe privilégios nessas tabelas.

## Segurança prevista

- RLS em todas as tabelas do schema `public`.
- RLS também nas tabelas privadas como defesa adicional.
- Sem acesso de `anon` às tabelas financeiras.
- Grants explícitos para `authenticated`.
- Funções auxiliares de autorização ficam em `private`.
- Nenhuma decisão de autorização depende de `user_metadata`.
- Nenhuma chave `service_role` / secret deve existir no navegador.

## Criação de workspace

O RPC `public.create_workspace(...)` foi desenhado como `SECURITY INVOKER`, portanto continua sujeito às próprias políticas RLS do usuário.

Ele cria, em uma transação:

1. a workspace;
2. o usuário como `owner`;
3. as categorias padrão.

## Antes de aplicar

Quando tivermos o projeto Supabase definitivo:

1. criar a migration usando o Supabase CLI;
2. revisar este schema contra a versão atual do Supabase;
3. aplicar em ambiente vazio;
4. rodar Security Advisor e Performance Advisor;
5. executar `verification.sql`;
6. testar RLS com pelo menos dois usuários e duas workspaces;
7. só então conectar o frontend.

## O que ainda não existe no banco

Deliberadamente deixado para fases posteriores:

- cobrança real (Stripe/Mercado Pago/etc.);
- Edge Functions de convite;
- automação de recorrências;
- importação OFX/CSV;
- integração bancária/Open Finance;
- deleção completa de conta;
- trilha de suporte administrativo.

Esses recursos serão adicionados sem mudar o princípio central de isolamento por workspace.
