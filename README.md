# Harman

Mobil uyumlu Next.js, Supabase ve Open-Meteo tabanli tarim takip web uygulamasi.

## Calistirma

```bash
npm install
npm run dev
```

Uygulama:

```text
http://localhost:3000
```

## Supabase Ayarlari

`.env.local` dosyasinda `NEXT_PUBLIC_SUPABASE_URL` degerini kendi Supabase Project URL degerinizle degistirin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://proje-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_or_anon_key
```

`service_role` veya gizli anahtar client tarafinda kullanilmamalidir.

## Veritabani

Supabase Dashboard > SQL Editor icinde `supabase/schema.sql` dosyasinin tamamini calistirin.

Bu SQL:

- `profiles`
- `fields`
- `field_operations`
- `plans`
- `weather_cache`

tablolarini, triggerlari ve RLS politikalarini olusturur.

## Sayfalar

- `/` landing page
- `/login`
- `/register`
- `/dashboard`
- `/fields`
- `/fields/new`
- `/fields/[id]`
- `/fields/[id]/operations/new`
- `/plans`
- `/weather`
- `/settings`

## Notlar

- TKGM verisi cekilmez; detay sayfasindaki buton yalnizca `https://parselsorgu.tkgm.gov.tr/` adresini acar.
- Hava durumu yorumlari oneridir, resmi veya kesin tarimsal garanti vermez.
- Kullanici verileri Supabase RLS politikalariyla kullanici bazinda ayrilir.

## Konum Secimi

Tarla ekleme formu il, ilce ve mahalle/koy bilgisini serbest metin yerine uygulama API route'lari uzerinden getirir:

- `/api/locations/cities`
- `/api/locations/districts?cityCode=42`
- `/api/locations/neighborhoods?districtCode=1262`

Bu route'lar Beterali API'yi kullanir ve frontend'i dis servise dogrudan baglamaz.

Mevcut veritabanina konum kolonlarini eklemek icin:

```sql
alter table public.fields
  add column if not exists city_code text,
  add column if not exists district_code text,
  add column if not exists neighborhood_code text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists location_source text;
```

Hava durumu artik tarla adresinden degil, kullanicinin Ayarlar sayfasinda sectigi tek hava durumu adresinden hesaplanir.
Mevcut veritabanina profil hava konumu kolonlarini eklemek icin `supabase/add-profile-weather-location.sql` dosyasini calistirin.
