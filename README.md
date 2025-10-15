Barcellos Racing — frontend (Next.js + Supabase) v5 - FULL PACKAGE

What's new in v5:
- Header shows 'Barcellos Racing' next to BR.
- 'Tema escuro' button matches size of 'Entrar'.
- Reports: three separate charts (Receita green, Despesas red, Lucro blue) for last 12 months. Summary for current month.
- Budgets saved with status (pending/closed); admin can change status. Closed budgets count as revenue.
- Budgets page: filter by client, month; create budgets with multiple items (products/services).

Install and run:
1. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
2. Run SQL: open Supabase SQL Editor and run sql/init_tables.sql
3. npm install && npm run dev
