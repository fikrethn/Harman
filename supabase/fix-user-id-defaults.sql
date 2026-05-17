alter table public.fields
  alter column user_id set default auth.uid();

alter table public.field_operations
  alter column user_id set default auth.uid();

alter table public.plans
  alter column user_id set default auth.uid();

alter table public.weather_cache
  alter column user_id set default auth.uid();
