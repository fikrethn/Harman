alter table public.profiles
  add column if not exists weather_city text,
  add column if not exists weather_city_code text,
  add column if not exists weather_district text,
  add column if not exists weather_district_code text,
  add column if not exists weather_neighborhood text,
  add column if not exists weather_neighborhood_code text,
  add column if not exists weather_latitude numeric,
  add column if not exists weather_longitude numeric,
  add column if not exists weather_location_source text;
