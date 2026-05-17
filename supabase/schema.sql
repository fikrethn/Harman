create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  weather_city text,
  weather_city_code text,
  weather_district text,
  weather_district_code text,
  weather_neighborhood text,
  weather_neighborhood_code text,
  weather_latitude numeric,
  weather_longitude numeric,
  weather_location_source text,
  created_at timestamptz default now()
);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  city text not null,
  city_code text,
  district text not null,
  district_code text,
  neighborhood text,
  neighborhood_code text,
  latitude numeric,
  longitude numeric,
  location_source text,
  block_no text,
  parcel_no text,
  area numeric,
  area_unit text check (area_unit in ('m2', 'dekar', 'hektar')),
  current_crop text,
  planting_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.field_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  field_id uuid references public.fields(id) on delete cascade,
  operation_type text not null,
  operation_date date not null,
  material_name text,
  amount numeric,
  unit text,
  cost numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  field_id uuid references public.fields(id) on delete cascade,
  title text not null,
  plan_type text,
  planned_crop text,
  planned_date date,
  status text default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.weather_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  field_id uuid references public.fields(id) on delete cascade,
  latitude numeric,
  longitude numeric,
  weather_json jsonb,
  fetched_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_fields_updated_at on public.fields;
create trigger set_fields_updated_at
before update on public.fields
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.fields enable row level security;
alter table public.field_operations enable row level security;
alter table public.plans enable row level security;
alter table public.weather_cache enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

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

drop policy if exists "operations_select_own" on public.field_operations;
create policy "operations_select_own"
on public.field_operations for select
using (auth.uid() = user_id);

drop policy if exists "operations_insert_own" on public.field_operations;
create policy "operations_insert_own"
on public.field_operations for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fields
    where fields.id = field_operations.field_id
    and fields.user_id = auth.uid()
  )
);

drop policy if exists "operations_update_own" on public.field_operations;
create policy "operations_update_own"
on public.field_operations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "operations_delete_own" on public.field_operations;
create policy "operations_delete_own"
on public.field_operations for delete
using (auth.uid() = user_id);

drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own"
on public.plans for select
using (auth.uid() = user_id);

drop policy if exists "plans_insert_own" on public.plans;
create policy "plans_insert_own"
on public.plans for insert
with check (
  auth.uid() = user_id
  and (
    field_id is null
    or exists (
      select 1 from public.fields
      where fields.id = plans.field_id
      and fields.user_id = auth.uid()
    )
  )
);

drop policy if exists "plans_update_own" on public.plans;
create policy "plans_update_own"
on public.plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "plans_delete_own" on public.plans;
create policy "plans_delete_own"
on public.plans for delete
using (auth.uid() = user_id);

drop policy if exists "weather_select_own" on public.weather_cache;
create policy "weather_select_own"
on public.weather_cache for select
using (auth.uid() = user_id);

drop policy if exists "weather_insert_own" on public.weather_cache;
create policy "weather_insert_own"
on public.weather_cache for insert
with check (auth.uid() = user_id);

drop policy if exists "weather_update_own" on public.weather_cache;
create policy "weather_update_own"
on public.weather_cache for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weather_delete_own" on public.weather_cache;
create policy "weather_delete_own"
on public.weather_cache for delete
using (auth.uid() = user_id);

create index if not exists fields_user_id_idx on public.fields(user_id);
create index if not exists field_operations_user_id_idx on public.field_operations(user_id);
create index if not exists field_operations_field_id_idx on public.field_operations(field_id);
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists weather_cache_field_id_idx on public.weather_cache(field_id);
