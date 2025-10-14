-- Init tables for Barcellos Racing; run in Supabase SQL Editor
create extension if not exists "uuid-ossp";

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
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

create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id),
  items text,
  total numeric,
  created_at timestamp with time zone default now()
);

create table if not exists investments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  amount numeric not null,
  category text,
  created_at timestamp with time zone default now()
);
