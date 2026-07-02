drop policy if exists "Public can create premium orders" on public.premium_orders;
create policy "Public can create premium orders"
on public.premium_orders
for insert
to anon, authenticated
with check (true);

