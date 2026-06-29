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

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price text,
  image_url text,
  tags jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  rating int not null default 5 check (rating between 1 and 5),
  image_url text,
  verified boolean not null default true,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  body text,
  image_url text,
  published_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists products_title_unique on public.products (title);
create unique index if not exists gallery_items_title_unique on public.gallery_items (title);
create unique index if not exists reviews_name_unique on public.reviews (name);
create unique index if not exists faqs_question_unique on public.faqs (question);
create unique index if not exists blog_posts_title_unique on public.blog_posts (title);

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reviews enable row level security;
alter table public.faqs enable row level security;
alter table public.blog_posts enable row level security;

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles for select
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active gallery" on public.gallery_items;
create policy "Public can read active gallery"
on public.gallery_items for select
using (active = true);

drop policy if exists "Admins can manage gallery" on public.gallery_items;
create policy "Admins can manage gallery"
on public.gallery_items for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active reviews" on public.reviews;
create policy "Public can read active reviews"
on public.reviews for select
using (active = true);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
on public.reviews for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active faqs" on public.faqs;
create policy "Public can read active faqs"
on public.faqs for select
using (active = true);

drop policy if exists "Admins can manage faqs" on public.faqs;
create policy "Admins can manage faqs"
on public.faqs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active blog posts" on public.blog_posts;
create policy "Public can read active blog posts"
on public.blog_posts for select
using (active = true);

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('melody-assets', 'melody-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read melody assets" on storage.objects;
create policy "Public can read melody assets"
on storage.objects for select
using (bucket_id = 'melody-assets');

drop policy if exists "Admins can upload melody assets" on storage.objects;
create policy "Admins can upload melody assets"
on storage.objects for insert
with check (bucket_id = 'melody-assets' and public.is_admin());

drop policy if exists "Admins can update melody assets" on storage.objects;
create policy "Admins can update melody assets"
on storage.objects for update
using (bucket_id = 'melody-assets' and public.is_admin())
with check (bucket_id = 'melody-assets' and public.is_admin());

drop policy if exists "Admins can delete melody assets" on storage.objects;
create policy "Admins can delete melody assets"
on storage.objects for delete
using (bucket_id = 'melody-assets' and public.is_admin());

insert into public.site_settings (id, content, design)
values (
  1,
  '{
    "brandName": "Melody Cards",
    "logoText": "MC",
    "heroEyebrow": "Luxury sound gifting",
    "heroTitleLine1": "Personalisierte Karten.",
    "heroTitleLine2": "Ein Lied, das bleibt.",
    "heroText": "Melody Cards verbindet hochwertige Grußkarten, individuelle Kompositionen und elegante QR-Code-Technologie zu einem Geschenk, das sofort berührt.",
    "primaryButtonText": "Jetzt bestellen",
    "primaryButtonHref": "#order",
    "secondaryButtonText": "Live Demo testen",
    "secondaryButtonHref": "#demo",
    "heroImage": "assets/images/melody-cards-premium-hero.png",
    "contactTitle": "Bereit für dein persönliches Lied?",
    "contactText": "Schreibe uns direkt per WhatsApp, E-Mail oder über das Bestellformular.",
    "contactEmail": "hello@melody-cards.example",
    "whatsappNumber": "491701234567",
    "whatsappMessage": "Hallo Melody Cards, ich möchte eine Premium-Karte bestellen.",
    "socialInstagram": "https://instagram.com/",
    "socialTikTok": "https://www.tiktok.com/",
    "socialYouTube": "https://www.youtube.com/",
    "footerText": "Premium-Karten mit QR-Code und eigens komponiertem Lied."
  }'::jsonb,
  '{
    "gold": "#d6b35a",
    "gold2": "#f4d984",
    "background": "#050505",
    "text": "#f7f0df",
    "muted": "#b9b09b"
  }'::jsonb
)
on conflict (id) do update
set content = excluded.content,
    design = excluded.design,
    updated_at = now();

insert into public.products (title, description, price, image_url, tags, sort_order, active)
select *
from (values
  ('Geburtstag', 'Signature Karte mit Geburtstagslied, QR-Seite und Goldfolie.', 'ab 49 EUR', 'assets/images/melody-cards-premium-hero.png', '["QR-Code","Custom Song","Premium Print"]'::jsonb, 1, true),
  ('Hochzeit', 'Elegante Karte für Eheversprechen, Gäste oder Geschenkübergabe.', 'ab 79 EUR', 'assets/images/premium-card-detail.png', '["Premium","Song","Gift Box"]'::jsonb, 2, true),
  ('Jahrestag', 'Romantischer Song mit gemeinsamen Erinnerungen und Premium-Design.', 'ab 69 EUR', 'assets/images/gift-moment.png', '["Romantik","QR-Code","Goldfolie"]'::jsonb, 3, true),
  ('Muttertag', 'Warme Worte, sanfte Melodie und hochwertiges Kartenpapier.', 'ab 59 EUR', 'assets/images/gift-box-packaging.png', '["Familie","Song","Box"]'::jsonb, 4, true),
  ('Vatertag', 'Persönlicher Song mit Humor, Dankbarkeit und klarer Stimme.', 'ab 59 EUR', 'assets/images/phone-music-player.png', '["Persönlich","Musik","Premium"]'::jsonb, 5, true),
  ('Weihnachten', 'Festliche Karte mit winterlichem Klang und Geschenkbox.', 'ab 64 EUR', 'assets/images/melody-cards-premium-hero.png', '["Festlich","Box","QR"]'::jsonb, 6, true),
  ('Neujahr', 'Moderner Song für Wünsche, Rückblick und Neustart.', 'ab 54 EUR', 'assets/images/premium-card-detail.png', '["Modern","QR","Song"]'::jsonb, 7, true),
  ('Valentinstag', 'Liebesbotschaft als Song mit privatem QR-Code.', 'ab 69 EUR', 'assets/images/gift-moment.png', '["Liebe","Duett","Premium"]'::jsonb, 8, true),
  ('Baby', 'Sanfte Willkommenskarte mit Schlaflied-Charakter.', 'ab 64 EUR', 'assets/images/gift-box-packaging.png', '["Baby","Sanft","Box"]'::jsonb, 9, true),
  ('Taufe', 'Feierliche Karte mit ruhiger, emotionaler Komposition.', 'ab 64 EUR', 'assets/images/phone-music-player.png', '["Feierlich","Klassisch","QR"]'::jsonb, 10, true),
  ('Abschluss', 'Motivierender Song für Meilensteine und Zukunftspläne.', 'ab 59 EUR', 'assets/images/melody-cards-premium-hero.png', '["Motivation","Premium","Song"]'::jsonb, 11, true),
  ('Firmenjubiläum', 'Corporate-Karte mit Markenfarbe, Teamtext und Hymne.', 'ab 129 EUR', 'assets/images/premium-card-detail.png', '["Corporate","Team","Brand"]'::jsonb, 12, true)
) as v(title, description, price, image_url, tags, sort_order, active)
on conflict (title) do update
set description = excluded.description,
    price = excluded.price,
    image_url = excluded.image_url,
    tags = excluded.tags,
    sort_order = excluded.sort_order,
    active = excluded.active,
    updated_at = now();

insert into public.gallery_items (title, description, category, image_url, sort_order, active)
select
  'Beispiel ' || lpad(i::text, 2, '0'),
  'Premium Galeriebeispiel für Melody Cards.',
  (array['Karte','QR-Code','Geschenkmoment','Geschenkbox','Smartphone','Verpackung','Detailaufnahme','Goldfolie'])[((i - 1) % 8) + 1],
  (array['assets/images/melody-cards-premium-hero.png','assets/images/premium-card-detail.png','assets/images/gift-moment.png','assets/images/gift-box-packaging.png','assets/images/phone-music-player.png'])[((i - 1) % 5) + 1],
  i,
  true
from generate_series(1, 40) as s(i)
on conflict (title) do update
set description = excluded.description,
    category = excluded.category,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    active = excluded.active,
    updated_at = now();

insert into public.reviews (name, text, rating, verified, sort_order, active)
select
  (array['Laura M.','Daniel R.','Sabrina K.','Nina W.','Omar A.','Clara P.','Jonas F.','Melek T.','Felix B.','Emma S.','Hannah L.','Tobias G.','Miriam N.','Leon C.','Julia H.','Marco E.','Sofia R.','Ben K.','Lea V.','Noah D.'])[i],
  'Die Karte wirkte unfassbar hochwertig und das Lied war genau auf uns zugeschnitten.',
  5,
  true,
  i,
  true
from generate_series(1, 20) as s(i)
on conflict (name) do update
set text = excluded.text,
    rating = excluded.rating,
    verified = excluded.verified,
    sort_order = excluded.sort_order,
    active = excluded.active;

insert into public.faqs (question, answer, sort_order, active)
select question, 'Melody Cards begleitet dich von Auswahl und Briefing bis zur fertigen Karte mit privater Song-Seite, QR-Code und optionaler Geschenkbox.', row_number() over (), true
from (values
  ('Wie funktioniert der QR-Code?'), ('Wie entsteht das Lied?'), ('Kann ich Text und Namen vorgeben?'), ('Welche Musikstile sind möglich?'), ('Gibt es männliche und weibliche Stimmen?'),
  ('Kann ich die Sprache wählen?'), ('Wie lange dauert die Produktion?'), ('Gibt es Express?'), ('Kann ich ein Foto hochladen?'), ('Ist die Song-Seite privat?'),
  ('Kann der QR-Code farbig sein?'), ('Welche Kartenfarben gibt es?'), ('Kann ich vorab eine Vorschau sehen?'), ('Was passiert nach der Bestellung?'), ('Wie wird die Karte verpackt?'),
  ('Gibt es Geschenkboxen?'), ('Kann ich mehrere Karten bestellen?'), ('Sind Firmenbestellungen möglich?'), ('Kann ich Änderungen wünschen?'), ('Welche Dateiformate sind erlaubt?'),
  ('Kann ich Audio aufnehmen?'), ('Wie lange bleibt der Song online?'), ('Kann ich den Song herunterladen?'), ('Was kostet eine Karte?'), ('Wie kontaktiere ich den Support?')
) as q(question)
on conflict (question) do update
set answer = excluded.answer,
    sort_order = excluded.sort_order,
    active = excluded.active;

insert into public.blog_posts (title, excerpt, image_url, published_at, active)
select
  title,
  'Inspiration, Tipps und Premium-Ideen für persönliche Karten mit eigenem Lied.',
  (array['assets/images/melody-cards-premium-hero.png','assets/images/premium-card-detail.png','assets/images/gift-moment.png','assets/images/gift-box-packaging.png','assets/images/phone-music-player.png'])[((row_number() over () - 1) % 5) + 1],
  now() - ((row_number() over ())::text || ' days')::interval,
  true
from (values
  ('Die perfekte Geburtstagsbotschaft'), ('Warum Musik Erinnerungen stärker macht'), ('QR-Code Geschenke richtig einsetzen'), ('Luxusverpackung für kleine Momente'),
  ('Songstil für Mama wählen'), ('Kartenfarben und Emotionen'), ('Geschenkideen für Hochzeitspaare'), ('Firmenjubiläum persönlich gestalten'),
  ('Checkliste für Express-Geschenke'), ('Wie ein Songbriefing gelingt'), ('Premium-Papier erklärt'), ('Digitale Geschenkseiten im Trend')
) as b(title)
on conflict (title) do update
set excerpt = excluded.excerpt,
    image_url = excluded.image_url,
    published_at = excluded.published_at,
    active = excluded.active;

-- Nach dem Erstellen deines Auth-Users:
-- insert into public.admin_profiles (user_id, role)
-- values ('AUTH_USER_ID_HIER_EINFUEGEN', 'admin');
