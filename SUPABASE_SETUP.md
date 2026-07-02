# Melody Cards Supabase Setup

Diese Anleitung verbindet die statische Webseite mit Supabase Auth, Datenbank und Storage. Im Frontend werden nur Supabase URL und Anon Key verwendet. Den Service Role Key niemals in `config.js` speichern.

## 1. Supabase-Projekt erstellen

1. Öffne https://supabase.com und erstelle ein neues Projekt.
2. Wähle eine Region nahe deiner Zielgruppe.
3. Warte, bis das Projekt vollständig erstellt ist.

## 2. Datenbank und Policies erstellen

1. Öffne in Supabase den Bereich `SQL Editor`.
2. Öffne die Datei `outputs/supabase.sql`.
3. Kopiere den kompletten Inhalt in den SQL Editor.
4. Führe das Script aus.

Das Script erstellt:
- `site_settings`
- `products`
- `gallery_items`
- `reviews`
- `faqs`
- `blog_posts`
- `premium_orders`
- `admin_profiles`
- RLS Policies
- Storage Bucket `melody-assets`
- Beispielinhalte

Nur Bestellformular nachrüsten:
Wenn deine bestehenden Tabellen schon existieren, kannst du alternativ nur `outputs/premium_orders.sql` im SQL Editor ausführen. Diese Datei erstellt `premium_orders` und erlaubt öffentliche Formular-Einträge sowie Uploads unter `orders/` im Bucket `melody-assets`.

## 3. Auth aktivieren

1. Gehe zu `Authentication` -> `Providers`.
2. Aktiviere `Email`.
3. Für einen einfachen Admin-Login kannst du `Confirm email` deaktivieren oder die Bestätigungsmail später anklicken.

## 4. Admin-Benutzer erstellen

1. Gehe zu `Authentication` -> `Users`.
2. Klicke `Add user`.
3. Lege die E-Mail `koglu@hotmail.de` und dein Passwort fest.
4. Kopiere danach die `User UID`.
5. Öffne erneut den SQL Editor und führe aus:

```sql
insert into public.admin_profiles (user_id, role)
values ('DEINE_USER_UID_HIER', 'admin')
on conflict (user_id) do update set role = 'admin';
```

Wenn der Benutzer `koglu@hotmail.de` bereits in Supabase Auth existiert, kannst du alternativ direkt ausführen:

```sql
insert into public.admin_profiles (user_id, role)
select id, 'admin'
from auth.users
where email = 'koglu@hotmail.de'
on conflict (user_id) do update set role = 'admin';
```

Die gleiche Anweisung liegt auch als `admin_koglu_profile.sql` im Projekt.

Erst dadurch darf dieser eingeloggte Benutzer Inhalte bearbeiten und Bilder hochladen.

## 5. Storage Bucket prüfen

Das SQL erstellt automatisch den öffentlichen Bucket `melody-assets`.

Prüfe unter `Storage`:
- Bucket `melody-assets` existiert
- Bucket ist public
- Policies für Lesen, Upload, Update und Löschen sind vorhanden
- Policy `Public can upload premium order files` ist vorhanden, wenn das Anfrageformular Datei-Uploads speichern soll

## 6. API Keys eintragen

1. Gehe zu `Project Settings` -> `API`.
2. Kopiere:
   - `Project URL`
   - `anon public` Key
3. Öffne `outputs/config.js`.
4. Trage die Werte ein:

```js
window.MELODY_SUPABASE_CONFIG = {
  url: "https://DEIN-PROJEKT.supabase.co",
  anonKey: "DEIN_ANON_PUBLIC_KEY",
  storageBucket: "melody-assets"
};
```

Wichtig: Nicht den Service Role Key verwenden.

## 7. Admin öffnen

Lokal:

```text
http://127.0.0.1:4173/admin/
```

Veröffentlicht:

```text
https://deine-domain.de/admin/
```

Logge dich mit dem in Supabase Auth angelegten Admin-Benutzer ein.

## 8. Inhalte bearbeiten

Im Admin-Bereich kannst du bearbeiten:
- Startseite: Logo, Hero, Buttons, Texte, Hero-Bild
- Produkte: hinzufügen, bearbeiten, löschen, Preise ändern, Bilder hochladen
- Galerie: hinzufügen, bearbeiten, löschen, Bilder hochladen
- Bewertungen: Namen, Texte, Sterne, Verifiziert-Status
- FAQ: Fragen und Antworten
- Kontakt: E-Mail, WhatsApp, Social Links, Footer
- Farben & Design: Gold, Text, Hintergrund

Wenn Supabase nicht verbunden ist, zeigt der Admin einen Demo-Modus. Änderungen werden dann nicht dauerhaft gespeichert.

## 9. Deployment-Hinweise

Die Seite ist statisch und kann z. B. auf Netlify, Vercel, Cloudflare Pages oder klassischem Webhosting veröffentlicht werden.

Für sauberes Routing muss `/admin/` als Ordner mit `index.html` erhalten bleiben.

## 10. Sicherheit

- RLS ist aktiviert.
- Öffentliche Besucher dürfen nur aktive Inhalte lesen.
- Nur Benutzer in `admin_profiles` mit Rolle `admin` dürfen schreiben.
- Der Supabase Anon Key ist im Frontend erlaubt.
- Der Service Role Key bleibt geheim und gehört nur in sichere Server-Umgebungen.
