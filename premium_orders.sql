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
  customer_name text,
  email text not null,
  phone text,
  address text,
  card_category text,
  recipient_name text,
  occasion text,
  song_language text,
  voice text,
  music_style text,
  story text,
  configurator jsonb,
  calculated_price numeric,
  card_photo_url text,
  card_text text,
  music_wish text,
  message text,
  file_url text,
  image_url text,
  video_url text,
  audio_url text,
  status text not null default 'neu',
  created_at timestamptz not null default now(),
  card_type text,
  language_ui text,
  customer_email text,
  customer_phone text,
  recipient_age text,
  relationship_to_recipient text,
  cover_mode text,
  cover_template text,
  cover_text text,
  cover_name text,
  cover_extra_text text,
  inside_left_mode text,
  inside_left_text text,
  inside_left_melody_notes text,
  inside_right_photo_enabled boolean default false,
  inside_right_photo_url text,
  inside_right_text_enabled boolean default false,
  inside_right_mode text,
  inside_right_text text,
  inside_right_melody_notes text,
  song_notes text,
  apology_reason text,
  mood text,
  personal_story text,
  special_details text,
  personalization_selected boolean default false,
  price_note text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_name text,
  email text not null,
  phone text,
  address text,
  card_category text,
  recipient_name text,
  occasion text,
  song_language text,
  voice text,
  music_style text,
  story text,
  configurator jsonb,
  calculated_price numeric,
  card_photo_url text,
  card_text text,
  music_wish text,
  message text,
  file_url text,
  image_url text,
  video_url text,
  audio_url text,
  status text not null default 'neu',
  created_at timestamptz not null default now(),
  card_type text,
  language_ui text,
  customer_email text,
  customer_phone text,
  recipient_age text,
  relationship_to_recipient text,
  cover_mode text,
  cover_template text,
  cover_text text,
  cover_name text,
  cover_extra_text text,
  inside_left_mode text,
  inside_left_text text,
  inside_left_melody_notes text,
  inside_right_photo_enabled boolean default false,
  inside_right_photo_url text,
  inside_right_text_enabled boolean default false,
  inside_right_mode text,
  inside_right_text text,
  inside_right_melody_notes text,
  song_notes text,
  apology_reason text,
  mood text,
  personal_story text,
  special_details text,
  personalization_selected boolean default false,
  price_note text
);

alter table public.premium_orders add column if not exists customer_name text;
alter table public.premium_orders add column if not exists card_category text;
alter table public.premium_orders add column if not exists recipient_name text;
alter table public.premium_orders add column if not exists occasion text;
alter table public.premium_orders add column if not exists song_language text;
alter table public.premium_orders add column if not exists voice text;
alter table public.premium_orders add column if not exists music_style text;
alter table public.premium_orders add column if not exists story text;
alter table public.premium_orders add column if not exists configurator jsonb;
alter table public.premium_orders add column if not exists calculated_price numeric;
alter table public.premium_orders add column if not exists card_photo_url text;
alter table public.premium_orders add column if not exists card_type text;
alter table public.premium_orders add column if not exists language_ui text;
alter table public.premium_orders add column if not exists customer_email text;
alter table public.premium_orders add column if not exists customer_phone text;
alter table public.premium_orders add column if not exists recipient_age text;
alter table public.premium_orders add column if not exists relationship_to_recipient text;
alter table public.premium_orders add column if not exists cover_mode text;
alter table public.premium_orders add column if not exists cover_template text;
alter table public.premium_orders add column if not exists cover_text text;
alter table public.premium_orders add column if not exists cover_name text;
alter table public.premium_orders add column if not exists cover_extra_text text;
alter table public.premium_orders add column if not exists inside_left_mode text;
alter table public.premium_orders add column if not exists inside_left_text text;
alter table public.premium_orders add column if not exists inside_left_melody_notes text;
alter table public.premium_orders add column if not exists inside_right_photo_enabled boolean default false;
alter table public.premium_orders add column if not exists inside_right_photo_url text;
alter table public.premium_orders add column if not exists inside_right_text_enabled boolean default false;
alter table public.premium_orders add column if not exists inside_right_mode text;
alter table public.premium_orders add column if not exists inside_right_text text;
alter table public.premium_orders add column if not exists inside_right_melody_notes text;
alter table public.premium_orders add column if not exists song_notes text;
alter table public.premium_orders add column if not exists apology_reason text;
alter table public.premium_orders add column if not exists mood text;
alter table public.premium_orders add column if not exists personal_story text;
alter table public.premium_orders add column if not exists special_details text;
alter table public.premium_orders add column if not exists personalization_selected boolean default false;
alter table public.premium_orders add column if not exists price_note text;
alter table public.premium_orders alter column status set default 'neu';
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists card_category text;
alter table public.orders add column if not exists recipient_name text;
alter table public.orders add column if not exists occasion text;
alter table public.orders add column if not exists song_language text;
alter table public.orders add column if not exists voice text;
alter table public.orders add column if not exists music_style text;
alter table public.orders add column if not exists story text;
alter table public.orders add column if not exists configurator jsonb;
alter table public.orders add column if not exists calculated_price numeric;
alter table public.orders add column if not exists card_photo_url text;
alter table public.orders add column if not exists card_type text;
alter table public.orders add column if not exists language_ui text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists recipient_age text;
alter table public.orders add column if not exists relationship_to_recipient text;
alter table public.orders add column if not exists cover_mode text;
alter table public.orders add column if not exists cover_template text;
alter table public.orders add column if not exists cover_text text;
alter table public.orders add column if not exists cover_name text;
alter table public.orders add column if not exists cover_extra_text text;
alter table public.orders add column if not exists inside_left_mode text;
alter table public.orders add column if not exists inside_left_text text;
alter table public.orders add column if not exists inside_left_melody_notes text;
alter table public.orders add column if not exists inside_right_photo_enabled boolean default false;
alter table public.orders add column if not exists inside_right_photo_url text;
alter table public.orders add column if not exists inside_right_text_enabled boolean default false;
alter table public.orders add column if not exists inside_right_mode text;
alter table public.orders add column if not exists inside_right_text text;
alter table public.orders add column if not exists inside_right_melody_notes text;
alter table public.orders add column if not exists song_notes text;
alter table public.orders add column if not exists apology_reason text;
alter table public.orders add column if not exists mood text;
alter table public.orders add column if not exists personal_story text;
alter table public.orders add column if not exists special_details text;
alter table public.orders add column if not exists personalization_selected boolean default false;
alter table public.orders add column if not exists price_note text;
alter table public.orders alter column status set default 'neu';

create index if not exists premium_orders_created_at_idx
on public.premium_orders (created_at desc);

create index if not exists premium_orders_status_idx
on public.premium_orders (status);

create index if not exists orders_created_at_idx
on public.orders (created_at desc);

create index if not exists orders_status_idx
on public.orders (status);

alter table public.premium_orders enable row level security;
alter table public.orders enable row level security;

grant insert on public.premium_orders to anon, authenticated;
grant select, update, delete on public.premium_orders to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

drop policy if exists "Public can create premium orders" on public.premium_orders;
create policy "Public can create premium orders"
on public.premium_orders for insert
to anon, authenticated
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

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders for delete
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('melody-assets', 'melody-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can upload premium order files" on storage.objects;
create policy "Public can upload premium order files"
on storage.objects for insert
with check (bucket_id = 'melody-assets' and (storage.foldername(name))[1] = 'orders');

-- Für den Admin-Login mit koglu@hotmail.de, wenn der Auth-User bereits existiert:
-- insert into public.admin_profiles (user_id, role)
-- select id, 'admin'
-- from auth.users
-- where email = 'koglu@hotmail.de'
-- on conflict (user_id) do update set role = 'admin';

notify pgrst, 'reload schema';
