-- Init tables for Barcellos Racing v8 (run in Supabase SQL Editor)
create extension if not exists "uuid-ossp";

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null,
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);

create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id),
  total numeric not null default 0,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists budget_items (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid references budgets(id) on delete cascade,
  item_type text check (item_type in ('product','service')),
  item_id uuid not null,
  quantity int default 1,
  price numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists investments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  amount numeric not null,
  category text,
  created_at timestamp with time zone default now()
);
