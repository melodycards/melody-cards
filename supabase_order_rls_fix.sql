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
