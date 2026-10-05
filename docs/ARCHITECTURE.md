# VisionMoneyPro — Arquitetura inicial

## Objetivo

O VisionMoneyPro nasce como um produto SaaS independente do A_Dois. Nenhum usuário, dado financeiro ou regra específica do projeto pessoal é compartilhada.

## Stack

- Next.js 16 App Router + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- GitHub Pages para a prévia estática do frontend
- Vercel como opção futura para rotas server-side/admin
- GitHub para versionamento

## Modelo multi-tenant

A unidade de isolamento é `workspace`.

- `profiles`: perfil global do usuário autenticado.
- `workspaces`: conta financeira individual ou compartilhada.
- `workspace_members`: vínculo entre usuários e workspaces com papéis `owner`, `admin` e `member`.
- Todas as tabelas financeiras carregam `workspace_id`.
- RLS valida a associação do usuário ao workspace antes de leitura ou escrita.

Um usuário pode participar de mais de um workspace no futuro sem duplicar a conta Auth.

## Privacidade

O painel administrativo comercial não deve usar as tabelas financeiras para a operação normal. Dados de assinatura, convites e administradores ficam fora da superfície normal do cliente.

O frontend usa somente `NEXT_PUBLIC_SUPABASE_URL` e uma publishable key. Chaves secretas ficam exclusivamente em backend seguro e nunca recebem prefixo `NEXT_PUBLIC_`.

## Fluxo de onboarding

1. Usuário cria conta.
2. Confirma o e-mail.
3. Escolhe uso individual ou compartilhado.
4. O app cria a workspace.
5. O banco cria a associação como owner e categorias padrão.
6. Para uso compartilhado, o owner poderá convidar outra pessoa.

## Painel administrativo

O futuro `/admin` será server-side e separado da aplicação financeira dos clientes.

Métricas previstas:

- usuários cadastrados;
- workspaces criadas;
- novos cadastros por período;
- workspaces individuais/compartilhadas;
- plano e status da assinatura;
- atividade e último acesso;
- bloqueio/suporte de conta sem expor finanças pessoais por padrão.

## Próximas etapas

1. Conectar um projeto Supabase exclusivo.
2. Aplicar a migration inicial e revisar Security/Performance Advisors.
3. Implementar onboarding de workspace.
4. Implementar CRUD de gastos/rendas.
5. Criar convite de membros.
6. Criar `/admin`.
7. Integrar cobrança somente depois do MVP funcional.
