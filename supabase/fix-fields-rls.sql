alter table public.fields enable row level security;

alter table public.fields
  alter column user_id set default auth.uid();

drop policy if exists "fields_select_own" on public.fields;
create policy "fields_select_own"
on public.fields for select
using (auth.uid() = user_id);

drop policy if exists "fields_insert_own" on public.fields;
create policy "fields_insert_own"
on public.fields for insert
with check (auth.uid() = user_id);

drop policy if exists "fields_update_own" on public.fields;
create policy "fields_update_own"
on public.fields for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "fields_delete_own" on public.fields;
create policy "fields_delete_own"
on public.fields for delete
using (auth.uid() = user_id);
