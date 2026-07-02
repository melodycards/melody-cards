-- Fuehre diese Datei im Supabase SQL Editor aus, nachdem der Auth-User
-- koglu@hotmail.de unter Authentication > Users existiert.

insert into public.admin_profiles (user_id, role)
select id, 'admin'
from auth.users
where email = 'koglu@hotmail.de'
on conflict (user_id) do update set role = 'admin';
