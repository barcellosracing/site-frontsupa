-- Tabelas iniciais para Supabase (execute no SQL Editor)
-- Inclui políticas públicas (permite uso enquanto você testa). Revise antes de produção!

create table if not exists clients (
  id serial primary key,
  name text,
  phone text,
  obs text,
  created_at timestamptz default now()
);

create table if not exists products (
  id serial primary key,
  name text,
  price numeric,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists services (
  id serial primary key,
  title text,
  value numeric,
  description text,
  created_at timestamptz default now()
);

create table if not exists quotes (
  id serial primary key,
  client_id integer references clients(id),
  items text,
  total numeric,
  created_at timestamptz default now()
);

create table if not exists investments (
  id serial primary key,
  title text,
  amount numeric,
  created_at timestamptz default now()
);

-- If RLS is enabled and you see "new row violates row-level security policy",
-- execute the following to create permissive policies for testing.
-- WARNING: these policies make the tables public. Restrict them before production.

-- Enable RLS (if not already)
alter table clients enable row level security;
alter table products enable row level security;
alter table services enable row level security;
alter table quotes enable row level security;
alter table investments enable row level security;

-- Create permissive policies for testing (allow anonymous/public access)
create policy "public_clients" on clients for all using (true) with check (true);
create policy "public_products" on products for all using (true) with check (true);
create policy "public_services" on services for all using (true) with check (true);
create policy "public_quotes" on quotes for all using (true) with check (true);
create policy "public_investments" on investments for all using (true) with check (true);

-- If you prefer to disable RLS instead, run (one-time):
-- alter table clients disable row level security;
-- alter table products disable row level security;
-- alter table services disable row level security;
-- alter table quotes disable row level security;
-- alter table investments disable row level security;
