# VisionMoneyPro

VisionMoneyPro é a nova base comercial do projeto financeiro, criada separadamente do uso pessoal do A_Dois.

## Estado atual

- Next.js + TypeScript mantido como base futura da aplicação
- Prévia estática do produto em `/docs`
- Interface responsiva
- Landing page, acesso e dashboard demonstrativo
- Arquitetura multi-tenant baseada em `workspaces`

## GitHub Pages — modo simples

O GitHub Pages serve diretamente a pasta `/docs` da branch `main`.

Configure em:

**Settings → Pages → Build and deployment → Source: Deploy from a branch**

Depois selecione:

- Branch: `main`
- Folder: `/docs`

URL:

`https://lzzamboniofc.github.io/VisionMoneyPro/`

Esse modelo não depende de GitHub Actions.

## Aplicação completa

O código Next.js na raiz continua sendo a base para evoluirmos o produto. O diretório `/docs` funciona como publicação estática simples enquanto a infraestrutura de backend é preparada.

## Supabase

O cadastro real será ativado quando conectarmos um projeto Supabase exclusivo do VisionMoneyPro.

## Arquitetura

Consulte `docs/ARCHITECTURE.md`.
