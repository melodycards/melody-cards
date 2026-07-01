create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.premium_orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  address text,
  card_text text,
  music_wish text,
  message text,
  file_url text,
  image_url text,
  video_url text,
  audio_url text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists premium_orders_created_at_idx
on public.premium_orders (created_at desc);

create index if not exists premium_orders_status_idx
on public.premium_orders (status);

alter table public.premium_orders enable row level security;

drop policy if exists "Public can create premium orders" on public.premium_orders;
create policy "Public can create premium orders"
on public.premium_orders for insert
with check (true);

drop policy if exists "Admins can read premium orders" on public.premium_orders;
create policy "Admins can read premium orders"
on public.premium_orders for select
using (public.is_admin());

drop policy if exists "Admins can update premium orders" on public.premium_orders;
create policy "Admins can update premium orders"
on public.premium_orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete premium orders" on public.premium_orders;
create policy "Admins can delete premium orders"
on public.premium_orders for delete
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('melody-assets', 'melody-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can upload premium order files" on storage.objects;
create policy "Public can upload premium order files"
on storage.objects for insert
with check (bucket_id = 'melody-assets' and (storage.foldername(name))[1] = 'orders');
