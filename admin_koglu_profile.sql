-- Fuehre diese Datei im Supabase SQL Editor aus, nachdem der Auth-User
-- koglu@hotmail.de unter Authentication > Users existiert.

insert into public.admin_profiles (user_id, role)
select id, 'admin'
from auth.users
where email = 'koglu@hotmail.de'
on conflict (user_id) do update set role = 'admin';

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
