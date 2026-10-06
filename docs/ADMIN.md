# VisionMoneyPro — Painel Administrativo

> Estado atual: frontend implementado com dados simulados. Nenhum dado foi lido ou gravado no Supabase.

## Objetivo

O Admin é a área operacional do produto VisionMoneyPro. Ele é separado da experiência financeira dos clientes.

O objetivo principal é permitir administrar:

- usuários;
- workspaces;
- membros;
- planos;
- status de acesso;
- assinaturas;
- atividade de produto;
- auditoria e suporte.

## Princípio de privacidade

A operação normal do Admin **não precisa carregar conteúdo financeiro do cliente**.

Por padrão, o Admin não deve consultar:

- gastos;
- receitas;
- cartões/faturas;
- contas a pagar;
- orçamentos;
- metas;
- valores financeiros privados.

Isso reduz a superfície de acesso administrativo e mantém o suporte focado em metadados operacionais.

## Visão geral implementada

A tela atual de `/admin/` possui:

- total de usuários;
- total de workspaces;
- MRR e conversão simulados;
- gráfico de crescimento;
- distribuição por plano;
- saúde da base;
- eventos recentes.

## Clientes

A área de clientes permite:

- buscar nome/e-mail/workspace;
- filtrar status;
- filtrar plano;
- abrir detalhe lateral;
- simular ativação/suspensão;
- simular troca de plano;
- simular reenvio de confirmação.

As ações são persistidas apenas no `localStorage` do navegador e geram eventos de auditoria simulados.

## Workspaces

A área de workspaces mostra:

- owner;
- tipo individual/compartilhado;
- quantidade de membros;
- plano;
- status;
- data de criação.

## Planos

Os preços atuais são apenas valores de demonstração:

- Free: R$ 0,00;
- Plus: R$ 19,90;
- Family: R$ 29,90.

Esses valores não representam decisão comercial final.

## Atividade / auditoria

A área de atividade foi preparada para receber eventos como:

- cadastro;
- criação/alteração de workspace;
- mudança de plano;
- alterações administrativas;
- acesso;
- convites e membros.

## Backend futuro

Quando o Supabase exclusivo estiver ativo, o Admin deverá ser server-side/protegido e consultar somente fontes autorizadas.

Modelo previsto:

- `auth.users` → identidade;
- `public.profiles` → nome/perfil;
- `public.workspaces` → workspace;
- `public.workspace_members` → membros;
- `private.subscriptions` → plano/assinatura;
- `private.admin_users` → autorização administrativa;
- `private.audit_events` → auditoria.

O navegador do Admin **não deve receber uma service_role/secret key**.

## Autorização

O acesso a `/admin` deverá exigir uma função administrativa confiável no backend.

Nunca usar `user_metadata` editável pelo próprio usuário para conceder permissão de Admin.

## Próxima integração

Quando o banco for ativado:

1. autenticar o operador;
2. validar a função administrativa no servidor;
3. trocar os mocks pelos dados reais;
4. ligar as ações de status/plano;
5. registrar cada ação em auditoria;
6. adicionar paginação e métricas reais;
7. conectar cobrança depois da definição comercial.
