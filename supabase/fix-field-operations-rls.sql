alter table public.field_operations enable row level security;

alter table public.field_operations
alter column user_id set default auth.uid();

drop policy if exists "operations_select_own" on public.field_operations;
create policy "operations_select_own"
on public.field_operations for select
using (
  auth.uid() = user_id
);

drop policy if exists "operations_insert_own" on public.field_operations;
create policy "operations_insert_own"
on public.field_operations for insert
with check (
  auth.uid() = user_id
  and field_id in (
    select id
    from public.fields
    where user_id = auth.uid()
  )
);

drop policy if exists "operations_update_own" on public.field_operations;
create policy "operations_update_own"
on public.field_operations for update
using (
  auth.uid() = user_id
  and field_id in (
    select id
    from public.fields
    where user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and field_id in (
    select id
    from public.fields
    where user_id = auth.uid()
  )
);

drop policy if exists "operations_delete_own" on public.field_operations;
create policy "operations_delete_own"
on public.field_operations for delete
using (
  auth.uid() = user_id
  and field_id in (
    select id
    from public.fields
    where user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.field_operations to authenticated;
