create extension if not exists pgcrypto;

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
alter table public.premium_orders add column if not exists card_text text;
alter table public.premium_orders add column if not exists music_wish text;
alter table public.premium_orders add column if not exists message text;
alter table public.premium_orders add column if not exists file_url text;
alter table public.premium_orders add column if not exists image_url text;
alter table public.premium_orders add column if not exists video_url text;
alter table public.premium_orders add column if not exists audio_url text;
alter table public.premium_orders add column if not exists status text default 'neu';
alter table public.premium_orders add column if not exists created_at timestamptz default now();
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

create index if not exists premium_orders_created_at_idx on public.premium_orders (created_at desc);
create index if not exists premium_orders_status_idx on public.premium_orders (status);

grant insert on public.premium_orders to anon, authenticated;
grant select, update, delete on public.premium_orders to authenticated;

alter table public.premium_orders enable row level security;

drop policy if exists "Public can create premium orders" on public.premium_orders;
create policy "Public can create premium orders"
on public.premium_orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read premium orders" on public.premium_orders;
create policy "Admins can read premium orders"
on public.premium_orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update premium orders" on public.premium_orders;
create policy "Admins can update premium orders"
on public.premium_orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete premium orders" on public.premium_orders;
create policy "Admins can delete premium orders"
on public.premium_orders
for delete
to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';
