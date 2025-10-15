Barcellos Racing — frontend (Next.js + Supabase) v7 - FULL PACKAGE

Resumo v7:
- Inclui páginas completas: /orcamentos e /relatorios (em português)
- Relatórios usam dados reais do Supabase (budgets com status 'closed' e investments)
- Orçamentos salvos em budgets + budget_items; status pode ser alterado por admin
- Investimentos / Despesas página com filtro por mês

Como usar:
1. Crie .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
2. No Supabase, execute sql/init_tables.sql no SQL Editor
3. npm install && npm run dev

Admin code: br.admin (grants admin for 1 hour in this browser)
