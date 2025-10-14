# Guia detalhado para iniciantes — Frontend-only + Supabase

## Requisitos
- Node.js >= 18
- Conta no Supabase (https://supabase.com)
- Git (opcional)

## 1) Criar projeto no Supabase
1. Acesse https://app.supabase.com e crie um projeto.
2. No painel do projeto, vá em "Settings" -> "API" e copie:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Na seção "Storage", crie um bucket chamado `uploads` (public ou private conforme preferir).
4. No SQL Editor execute o arquivo `sql/init_tables.sql` incluído neste pacote para criar tabelas.

## 2) Configurar localmente
1. Renomeie `.env.local.example` para `.env.local` e preencha:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

## 3) Rodar localmente
```bash
npm install
npm run dev
# Acesse http://localhost:3000
```

## 4) Como usar
- Use a página **Login** para criar usuários via magic link.
- Vá em **Clientes**, **Produtos**, **Serviços** etc. para criar/editar/excluir.
- Ao criar orçamentos, você pode gerar PDF e baixar.
- Relatórios mostram gráficos com receita por mês.

## 5) Deploy recomendado
- Frontend: **Vercel** (ideal para Next.js). Alternativas: Netlify, Render.
- Banco/Storage/Auth: **Supabase**.

No painel do Vercel, configure as variáveis de ambiente:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Depois faça push para GitHub e importe no Vercel.

