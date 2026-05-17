alter table public.fields
  add column if not exists city_code text,
  add column if not exists district_code text,
  add column if not exists neighborhood_code text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists location_source text;
