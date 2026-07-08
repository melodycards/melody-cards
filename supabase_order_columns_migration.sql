alter table public.premium_orders add column if not exists card_type text;
alter table public.premium_orders add column if not exists language_ui text;
alter table public.premium_orders add column if not exists customer_name text;
alter table public.premium_orders add column if not exists customer_email text;
alter table public.premium_orders add column if not exists customer_phone text;
alter table public.premium_orders add column if not exists recipient_name text;
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
alter table public.premium_orders add column if not exists song_language text;
alter table public.premium_orders add column if not exists voice text;
alter table public.premium_orders add column if not exists music_style text;
alter table public.premium_orders add column if not exists song_notes text;
alter table public.premium_orders add column if not exists apology_reason text;
alter table public.premium_orders add column if not exists mood text;
alter table public.premium_orders add column if not exists personal_story text;
alter table public.premium_orders add column if not exists special_details text;
alter table public.premium_orders add column if not exists image_url text;
alter table public.premium_orders add column if not exists video_url text;
alter table public.premium_orders add column if not exists audio_url text;
alter table public.premium_orders add column if not exists personalization_selected boolean default false;
alter table public.premium_orders add column if not exists price_note text;

grant insert on public.premium_orders to anon, authenticated;
grant select, update, delete on public.premium_orders to authenticated;

alter table public.premium_orders enable row level security;

drop policy if exists "Public can create premium orders" on public.premium_orders;
create policy "Public can create premium orders"
on public.premium_orders
for insert
to anon, authenticated
with check (true);

notify pgrst, 'reload schema';
