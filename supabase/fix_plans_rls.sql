alter table public.plans
  alter column user_id set default auth.uid();

alter table public.plans enable row level security;

grant select, insert, update, delete on public.plans to authenticated;

drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own"
on public.plans for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "plans_insert_own" on public.plans;
create policy "plans_insert_own"
on public.plans for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    field_id is null
    or field_id in (
      select id
      from public.fields
      where user_id = auth.uid()
    )
  )
);

drop policy if exists "plans_update_own" on public.plans;
create policy "plans_update_own"
on public.plans for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "plans_delete_own" on public.plans;
create policy "plans_delete_own"
on public.plans for delete
to authenticated
using (auth.uid() = user_id);
