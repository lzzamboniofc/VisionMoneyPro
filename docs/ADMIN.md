# VisionMoneyPro — Painel Administrativo

> Estado atual: frontend implementado com dados simulados/localStorage. Nenhum dado foi lido ou gravado no Supabase.

## Objetivo

O Admin é a área operacional do VisionMoneyPro e fica separado da experiência financeira dos clientes.

Ele foi preparado para administrar:

- usuários;
- workspaces;
- membros;
- planos;
- assinatura;
- status de acesso;
- atividade do produto;
- auditoria;
- suporte operacional.

## Acesso atual

A rota `/admin/` exige uma sessão administrativa local de demonstração.

A tela `/admin/login/` existe somente para validar a experiência do Admin em GitHub Pages.

Como GitHub Pages é hospedagem estática, **essa barreira não é segurança real**. As credenciais de demonstração existem no próprio frontend e qualquer pessoa com acesso ao código pode encontrá-las.

Quando o backend estiver ativo, o acesso deverá ser substituído por autenticação real + autorização administrativa validada no servidor.

## Princípio de privacidade

A operação normal do Admin não precisa carregar conteúdo financeiro do cliente.

Por padrão, o painel não consulta nem exibe:

- gastos;
- receitas;
- cartões/faturas;
- contas a pagar;
- orçamentos;
- metas;
- valores financeiros privados.

O Admin trabalha com metadados operacionais.

## Visão geral

A tela de visão geral mostra:

- usuários cadastrados;
- workspaces ativos;
- MRR estimado;
- conversão para planos pagos;
- crescimento de cadastros;
- distribuição dos planos;
- saúde da base;
- pagamentos pendentes;
- eventos recentes.

## Clientes

A área de clientes possui:

- busca por nome, e-mail ou workspace;
- filtro por status;
- filtro por plano;
- paginação;
- detalhe lateral do cliente;
- ativação/suspensão simulada;
- alteração de plano;
- reenvio simulado de confirmação.

## Assinaturas

Cada workspace pode simular os seguintes estados:

- ativa;
- em teste;
- pagamento pendente;
- cancelada;
- não se aplica (Free).

Somente assinaturas ativas/em teste entram no MRR demonstrativo.

Os preços atuais são apenas valores de demonstração:

- Free: R$ 0,00;
- Plus: R$ 19,90;
- Family: R$ 29,90.

Nenhum preço comercial definitivo foi decidido.

## Suporte

O drawer do cliente possui notas operacionais de suporte.

Essas notas devem tratar somente de temas como:

- acesso;
- cadastro;
- workspace;
- membros;
- cobrança;
- plano;
- problemas de produto.

Elas não devem ser usadas para copiar ou registrar dados financeiros privados do cliente.

## Workspaces

A área de workspaces mostra:

- owner;
- tipo individual/compartilhado;
- membros;
- plano;
- status de assinatura;
- status da conta;
- paginação.

## Atividade e auditoria

A área de atividade registra eventos simulados como:

- cadastro;
- acesso;
- workspace;
- mudança de plano;
- mudança de assinatura;
- ações administrativas;
- notas de suporte.

A lista possui filtros e paginação.

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

O navegador do Admin nunca deve receber uma `service_role` / secret key.

## Autorização

A autorização administrativa real deverá ser validada em backend confiável.

Não usar `user_metadata` editável pelo próprio usuário para conceder acesso administrativo.

## Próxima integração

Quando o banco for ativado:

1. autenticar o operador;
2. validar a função administrativa no servidor;
3. trocar mocks pelos usuários/workspaces reais;
4. paginar consultas no banco;
5. conectar status/plano/assinatura;
6. registrar cada ação administrativa em auditoria;
7. persistir notas de suporte de forma privada;
8. integrar o provedor de cobrança;
9. adicionar permissões específicas para owner/admin/support.
