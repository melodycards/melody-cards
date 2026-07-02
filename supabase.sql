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
  category text,
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

create unique index if not exists products_title_unique on public.products (title);
create unique index if not exists gallery_items_title_unique on public.gallery_items (title);
create unique index if not exists reviews_name_unique on public.reviews (name);
create unique index if not exists faqs_question_unique on public.faqs (question);
create unique index if not exists blog_posts_title_unique on public.blog_posts (title);
create index if not exists premium_orders_created_at_idx on public.premium_orders (created_at desc);
create index if not exists premium_orders_status_idx on public.premium_orders (status);

alter table public.products add column if not exists category text;

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reviews enable row level security;
alter table public.faqs enable row level security;
alter table public.blog_posts enable row level security;
alter table public.premium_orders enable row level security;

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles for select
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "Koglu can bootstrap own admin profile" on public.admin_profiles;
create policy "Koglu can bootstrap own admin profile"
on public.admin_profiles for insert
with check (
  user_id = auth.uid()
  and role = 'admin'
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'koglu@hotmail.de'
);

drop policy if exists "Koglu can update own admin profile" on public.admin_profiles;
create policy "Koglu can update own admin profile"
on public.admin_profiles for update
using (
  user_id = auth.uid()
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'koglu@hotmail.de'
)
with check (
  user_id = auth.uid()
  and role = 'admin'
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'koglu@hotmail.de'
);

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

drop policy if exists "Public can upload premium order files" on storage.objects;
create policy "Public can upload premium order files"
on storage.objects for insert
with check (bucket_id = 'melody-assets' and (storage.foldername(name))[1] = 'orders');

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
    "logoImage": "",
    "faviconImage": "",
    "heroImage": "",
    "heroEyebrow": "Melody Cards",
    "heroTitleLine1": "Handgemachte Karten",
    "heroTitleLine2": "für besondere Menschen.",
    "heroText": "Persönliche Botschaften, Fotos, Erinnerungen und auf Wunsch ein QR-Code oder Lied. Warm gestaltet, handgemacht gedacht, bewusst verschenkt.",
    "primaryButtonText": "Karte gestalten",
    "primaryButtonHref": "#order",
    "secondaryButtonText": "Beispiele ansehen",
    "secondaryButtonHref": "#examples",
    "introEyebrow": "Der Gedanke",
    "introTitle": "Ein Geschenk, das sich persönlich anfühlt.",
    "introText": "Melody Cards ist für Geburtstage, Hochzeiten, Liebe, Familie, Muttertag und Erinnerungen gemacht. Jede Karte beginnt mit einer echten Geschichte und wird anschließend warm, ruhig und hochwertig gestaltet.",
    "promiseItems": [
      {"number": "01", "title": "Botschaft", "text": "Du erzählst, für wen die Karte ist und was sie ausdrücken soll.", "active": true},
      {"number": "02", "title": "Gestaltung", "text": "Wir verbinden Text, Foto, Papierwirkung und digitale Elemente zu einem klaren Entwurf.", "active": true},
      {"number": "03", "title": "Erinnerung", "text": "Optional ergänzen wir ein Lied oder einen QR-Code, wenn es zur Geschichte passt.", "active": true}
    ],
    "processEyebrow": "So funktioniert es",
    "processTitle": "Wenige Schritte. Viel Gefühl.",
    "processText": "Keine automatische Bestellung und keine Zahlung auf der Webseite. Du sendest eine Anfrage, wir melden uns persönlich mit Rückfragen und einem klaren Vorschlag.",
    "processSteps": [
      {"number": "01", "title": "Anlass beschreiben", "text": "Du wählst den Moment und beschreibst die Person, die Botschaft und die Stimmung.", "active": true},
      {"number": "02", "title": "Material senden", "text": "Optional lädst du Foto, Text, Audio oder andere Erinnerungen hoch.", "active": true},
      {"number": "03", "title": "Entwurf abstimmen", "text": "Wir klären, ob Karte, Lied oder QR-Code sinnvoll sind und wie schlicht das Ergebnis wirken soll.", "active": true}
    ],
    "productsEyebrow": "Anlässe",
    "productsTitle": "Für Momente, die Nähe brauchen.",
    "productsText": "Die Anlasskarten sind nur ein Startpunkt. Jede Melody Card wird danach individuell und ohne Standardtext gestaltet.",
    "examplesEyebrow": "Beispiele",
    "examplesTitle": "Warm außen. Persönlich innen.",
    "examplesText": "Feine Papierwirkung, ruhige Bilder, ein sichtbarer QR-Code und Worte, die zur Person passen.",
    "exampleItems": [
      {"category": "Geburtstag", "text": "Eine offene Karte mit Foto, Namen und wenigen ehrlichen Zeilen.", "active": true},
      {"category": "Hochzeit", "text": "Champagnerfarbenes Papier für Worte, die bleiben sollen.", "active": true},
      {"category": "Liebe", "text": "Ein persönlicher Gruß, weich und nah, ohne Überladung.", "active": true},
      {"category": "Familie", "text": "Eine Botschaft, die Nähe über Generationen hinweg bewahrt.", "active": true}
    ],
    "galleryEyebrow": "Galerie",
    "galleryTitle": "Material, Licht und kleine Details.",
    "galleryText": "Die Galerie zeigt die Richtung: geöffnete Karten, QR-Code, Blumen, Geschenkband, Foto, Papierstruktur und warmes Licht.",
    "faqEyebrow": "FAQ",
    "faqTitle": "Antworten, bevor du anfragst.",
    "aboutEyebrow": "Über uns",
    "aboutTitle": "Handmade, persönlich und bewusst reduziert.",
    "aboutText": "Melody Cards entsteht aus der Idee, dass ein Geschenk nicht größer, lauter oder teurer wirken muss, um wichtig zu sein.",
    "aboutImage": "",
    "aboutCards": [
      {"title": "Persönlich", "text": "Jede Anfrage wird gelesen, nicht automatisch verarbeitet.", "active": true},
      {"title": "Handmade", "text": "Das Ergebnis soll sich nach einem echten, gedachten Geschenk anfühlen.", "active": true},
      {"title": "Zurückhaltend", "text": "Design, Foto, Lied und QR-Code werden nur eingesetzt, wenn sie den Moment stärken.", "active": true}
    ],
    "orderEyebrow": "Karte gestalten",
    "orderTitle": "Erzähl uns, was die Karte sagen soll.",
    "orderText": "Das Formular ist eine Anfrage. Wir prüfen deine Angaben und melden uns persönlich zurück. Es wird keine Zahlung ausgelöst.",
    "legalEyebrow": "Rechtliches",
    "legalTitle": "Transparent vor deiner Anfrage.",
    "legalText": "Alle wichtigen rechtlichen Informationen sind jederzeit erreichbar: Datenschutz, AGB, Impressum, Widerruf sowie Versand und Zahlung.",
    "contactTitle": "Offen für Fragen vor der Anfrage.",
    "contactText": "Wenn du unsicher bist, ob eine Karte, ein Lied oder ein QR-Code passt, schreibe uns kurz. Wir antworten ohne Verkaufsdruck.",
    "contactEmail": "hello@melody-cards.example",
    "contactPhone": "+49 170 1234567",
    "contactAddress": "Musterstraße 1, 12345 Musterstadt",
    "whatsappNumber": "491701234567",
    "whatsappMessage": "Hallo Melody Cards, ich möchte eine Premium-Karte bestellen.",
    "socialInstagram": "https://instagram.com/",
    "socialTikTok": "https://www.tiktok.com/",
    "socialYouTube": "https://www.youtube.com/",
    "footerText": "Handgemachte Karten mit persönlicher Botschaft, Foto, Lied oder QR-Code.",
    "mediaLibrary": [],
    "navItems": [
      {"label": "Startseite", "href": "#home", "active": true},
      {"label": "So funktioniert es", "href": "#process", "active": true},
      {"label": "Anlässe", "href": "#products", "active": true},
      {"label": "Beispiele", "href": "#examples", "active": true},
      {"label": "Galerie", "href": "#gallery", "active": true},
      {"label": "Über uns", "href": "#about", "active": true},
      {"label": "FAQ", "href": "#faq", "active": true},
      {"label": "Kontakt", "href": "#contact", "active": true},
      {"label": "Karte gestalten", "href": "#order", "active": true, "className": "nav-order"}
    ],
    "configurator": {
      "backText": "Zurück",
      "nextText": "Weiter",
      "submitText": "Anfrage senden",
      "steps": {
        "recipientFor": {"title": "Für wen ist die Karte?", "options": ["Ehemann", "Ehefrau", "Partner/in", "Freundin", "Freund", "Kind", "Vater", "Mutter", "Großeltern", "Enkelkind", "Schwester/Bruder", "Lehrer/in", "Haustier", "Ich selbst", "Sonstiges"], "required": true},
        "recipientName": {"title": "Wie heißt die Person?", "required": true},
        "occasion": {"title": "Was ist der Anlass?", "options": ["Geburtstag", "Hochzeit", "Jahrestag", "Valentinstag", "Muttertag", "Vatertag", "Geburt", "Freundschaft", "Gute Besserung", "Abschied", "Danke", "Erinnerung", "Einfach so", "Sonstiges"], "required": true},
        "included": {"title": "Was soll in der Karte enthalten sein?", "options": ["Persönliche Nachricht", "Foto", "Video", "Audioaufnahme", "QR-Code", "Persönliches Lied"], "required": true},
        "specialPerson": {"title": "Was macht die Person besonders?", "required": true},
        "memoryMessage": {"title": "Welche Erinnerung oder Botschaft soll rein?", "required": true},
        "heartWords": {"title": "Worte aus dem Herzen", "required": true},
        "contact": {"title": "Zusammenfassung + Kontaktdaten", "required": true}
      }
    },
    "legalPages": {
      "impressum": "",
      "datenschutz": "",
      "agb": "",
      "widerruf": "",
      "versand": ""
    }
  }'::jsonb,
  '{
    "background": "#ffffff",
    "text": "#1d1d1f",
    "muted": "#6e6e73"
  }'::jsonb
)
on conflict (id) do update
set content = excluded.content,
    design = excluded.design,
    updated_at = now();

insert into public.products (title, description, category, price, image_url, tags, sort_order, active)
select *
from (values
  ('Geburtstag', 'Eine persönliche Karte mit Foto, Botschaft und auf Wunsch QR-Code oder Lied.', 'Geburtstag', '', '', '["Handmade","Persönlich"]'::jsonb, 1, true),
  ('Hochzeit', 'Ein ruhiger Gruß für Worte, Erinnerungen und kleine Momente rund um den Tag.', 'Hochzeit', '', '', '["Schlicht","Persönlich"]'::jsonb, 2, true),
  ('Liebe', 'Eine schlichte Karte für Nähe, Dankbarkeit und Sätze, die bleiben sollen.', 'Liebe', '', '', '["Botschaft","Foto"]'::jsonb, 3, true),
  ('Familie', 'Für Eltern, Großeltern, Geschwister oder Menschen, die sich wie Familie anfühlen.', 'Familie', '', '', '["Familie","Handmade"]'::jsonb, 4, true),
  ('Muttertag', 'Eine handgemachte Karte mit warmem Text und persönlichem Bild.', 'Muttertag', '', '', '["Foto","Botschaft"]'::jsonb, 5, true),
  ('Erinnerung', 'Für Abschied, Dankbarkeit oder einen Moment, den man bewahren möchte.', 'Erinnerung', '', '', '["Erinnerung","QR-Code"]'::jsonb, 6, true)
) as v(title, description, category, price, image_url, tags, sort_order, active)
on conflict (title) do update
set description = excluded.description,
    category = excluded.category,
    price = excluded.price,
    image_url = excluded.image_url,
    tags = excluded.tags,
    sort_order = excluded.sort_order,
    active = excluded.active,
    updated_at = now();

insert into public.gallery_items (title, description, category, image_url, sort_order, active)
select
  (array['Papier','Foto','Botschaft','QR-Code','Umschlag','Detail'])[i],
  'Ruhige Richtung im Melody Cards Stil.',
  (array['Papier','Foto','Botschaft','QR-Code','Umschlag','Detail'])[i],
  '',
  i,
  true
from generate_series(1, 6) as s(i)
on conflict (title) do update
set description = excluded.description,
    category = excluded.category,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    active = excluded.active,
    updated_at = now();

insert into public.faqs (question, answer, sort_order, active)
select question, 'Wir klären diesen Punkt persönlich im Anfrageprozess. So bleibt die Karte passend zur Geschichte und es entstehen keine falschen Versprechen.', row_number() over (), true
from (values
  ('Ist das Formular eine Bestellung?'), ('Kann ich ein Foto hochladen?'), ('Muss jede Karte ein Lied haben?'), ('Kann ein QR-Code integriert werden?'),
  ('Kann ich den Text selbst schreiben?'), ('Wie läuft die Abstimmung ab?'), ('Gibt es automatische Zahlungen?'), ('Welche Dateien kann ich mitsenden?')
) as q(question)
on conflict (question) do update
set answer = excluded.answer,
    sort_order = excluded.sort_order,
    active = excluded.active;

-- Nach dem Erstellen deines Auth-Users:
-- insert into public.admin_profiles (user_id, role)
-- values ('AUTH_USER_ID_HIER_EINFUEGEN', 'admin');
--
-- Für den Admin-Login mit koglu@hotmail.de, wenn der Auth-User bereits existiert:
-- insert into public.admin_profiles (user_id, role)
-- select id, 'admin'
-- from auth.users
-- where email = 'koglu@hotmail.de'
-- on conflict (user_id) do update set role = 'admin';
