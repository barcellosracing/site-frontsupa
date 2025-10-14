(igual à versão anterior) Configure variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel.
Execute `sql/init_tables.sql` no SQL Editor do Supabase (esse arquivo inclui políticas públicas para testes).

Observação de segurança: as políticas incluídas permitem acesso amplo (para evitar erros de RLS). Antes de ir à produção, recomendo revisar e restringir políticas conforme sua necessidade.
