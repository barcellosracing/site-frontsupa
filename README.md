Barcellos Racing — frontend (Next.js + Supabase) v8 - FULL PACKAGE

Fixes and improvements in v8:
- Brand name 'Barcellos Racing' appears in the header next to the BR button and inside the drawer top.
- Drawer now closes automatically when navigating (Link clicks close it).
- Guarded all localStorage usage to avoid client-side exceptions during SSR.
- Orçamentos: 'Novo Orçamento' button placed top-right; form appears inline and is responsive.
- Drawer menu items have visible margins and hover states.

How to run:
1. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
2. In Supabase SQL Editor run sql/init_tables.sql
3. npm install && npm run dev

If you deploy to Vercel, set the two NEXT_PUBLIC_ variables in the Vercel project settings.

Admin code: br.admin (grants admin access in current browser for 1 hour)
