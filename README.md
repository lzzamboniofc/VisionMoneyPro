# VisionMoneyPro

VisionMoneyPro é a nova base comercial do projeto financeiro, criada separadamente do uso pessoal do A_Dois.

## Estado atual

- Next.js + TypeScript
- Export estático compatível com GitHub Pages
- Interface inicial responsiva
- Login/cadastro preparado para Supabase no navegador
- Dashboard inicial
- Arquitetura multi-tenant baseada em `workspaces`
- Workflow automático do GitHub Pages em `.github/workflows/pages.yml`

## GitHub Pages

O deploy é feito automaticamente pelo GitHub Actions a cada push na `main`.

URL esperada:

`https://lzzamboniofc.github.io/VisionMoneyPro/`

## Supabase

Quando o projeto Supabase exclusivo do VisionMoneyPro estiver disponível, adicione em **Settings → Secrets and variables → Actions → Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Depois configure no Supabase Auth a URL do GitHub Pages entre as URLs permitidas de redirecionamento.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Use `.env.example` como referência para `.env.local`.

## Arquitetura

Consulte `docs/ARCHITECTURE.md`.
