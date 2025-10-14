-- Tabelas iniciais para Supabase (execute no SQL Editor)

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
  image_url text,
  created_at timestamptz default now()
);

create table if not exists services (
  id serial primary key,
  title text,
  value numeric,
  created_at timestamptz default now()
);

create table if not exists quotes (
  id serial primary key,
  client_id integer references clients(id),
  items text,
  total numeric,
  created_at timestamptz default now()
);

-- Optional: enable RLS and policies as needed in Supabase dashboard.
