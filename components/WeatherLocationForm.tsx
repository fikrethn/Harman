"use client";

import { useCallback, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/Button";
import { LocationSelect, type SelectedLocation } from "@/components/LocationSelect";
import { MapPicker } from "@/components/MapPicker";
import { useI18n } from "@/lib/i18n";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/database";

type GeocodeResponse = {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};

async function geocodeWeatherLocation(form: FormData) {
  const city = String(form.get("weather_city") || "");
  const district = String(form.get("weather_district") || "");
  const neighborhood = String(form.get("weather_neighborhood") || "");
  if (!city || !district) return null;

  const params = new URLSearchParams({ city, district, neighborhood });
  const response = await fetch(`/api/locations/geocode?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodeResponse;
  return data.location ?? null;
}

export function WeatherLocationForm({
  profile,
  userId,
  onSaved,
}: {
  profile: Profile | null;
  userId: string;
  onSaved: (profile: Profile) => void;
}) {
  const { locale, t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapFocus, setMapFocus] = useState<{ latitude: number; longitude: number; zoom: number } | null>(null);

  const updateMapFocus = useCallback(async (location: SelectedLocation) => {
    if (!location.city) {
      setMapFocus(null);
      return;
    }

    const params = new URLSearchParams({
      city: location.city.name,
      district: location.district?.name ?? "",
      neighborhood: location.neighborhood?.name ?? "",
    });

    const response = await fetch(`/api/locations/geocode?${params.toString()}`);
    if (!response.ok) return;

    const data = (await response.json()) as GeocodeResponse;
    if (!data.location) return;

    setMapFocus({
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      zoom: location.neighborhood ? 14 : location.district ? 12 : 9,
    });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const mapLatitude = Number(form.get("weather_latitude")) || null;
    const mapLongitude = Number(form.get("weather_longitude")) || null;
    const location = mapLatitude && mapLongitude ? { latitude: mapLatitude, longitude: mapLongitude } : await geocodeWeatherLocation(form);

    if (!location) {
      setSaving(false);
      setMessage(locale === "tr" ? "Bu hava durumu adresi için koordinat bulunamadı." : "No coordinates found for this weather address.");
      return;
    }

    const payload = {
      id: userId,
      full_name: profile?.full_name ?? null,
      weather_city: String(form.get("weather_city") || ""),
      weather_city_code: String(form.get("weather_city_code") || "") || null,
      weather_district: String(form.get("weather_district") || ""),
      weather_district_code: String(form.get("weather_district_code") || "") || null,
      weather_neighborhood: String(form.get("weather_neighborhood") || "") || null,
      weather_neighborhood_code: String(form.get("weather_neighborhood_code") || "") || null,
      weather_latitude: location.latitude,
      weather_longitude: location.longitude,
      weather_location_source: mapLatitude && mapLongitude ? "weather_map_pin" : "weather_address_geocoded",
    };

    const { data, error } = await requireSupabase().from("profiles").upsert(payload).select("*").single();
    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    onSaved(data as Profile);
    setMessage(locale === "tr" ? "Hava durumu adresi kaydedildi." : "Weather address saved.");
  }

  return (
    <form onSubmit={submit} className="grid content-start gap-3 rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black">{locale === "tr" ? "Hava durumu adresi" : "Weather address"}</h2>
          <p className="mt-1 max-w-2xl text-xs text-stone-600 dark:text-stone-400">
          {locale === "tr"
            ? "Tüm hava kartları bu seçili adresin koordinatını kullanır."
            : "All weather cards use this selected address; field addresses no longer change the forecast location."}
          </p>
        </div>
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <MapPin size={15} />
        </span>
      </div>

      <LocationSelect
        namePrefix="weather_"
        initialCityCode={profile?.weather_city_code}
        initialDistrictCode={profile?.weather_district_code}
        initialNeighborhoodCode={profile?.weather_neighborhood_code}
        onLocationChange={updateMapFocus}
      />

      <input type="hidden" name="weather_latitude" value={latitude} />
      <input type="hidden" name="weather_longitude" value={longitude} />

      <div className="flex flex-col gap-2 rounded-lg border border-stone-300 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <span className="font-black text-stone-800 dark:text-stone-100">{locale === "tr" ? "Koordinat" : "Coordinates"}: </span>
            {latitude && longitude
              ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
              : profile?.weather_latitude && profile.weather_longitude
                ? `${Number(profile.weather_latitude).toFixed(5)}, ${Number(profile.weather_longitude).toFixed(5)}`
                : locale === "tr"
                  ? "Adresden alınır veya haritadan seçilir."
                  : "From address or map pick."}
          </p>
          <MapPicker
            latitude={latitude ? Number(latitude) : profile?.weather_latitude}
            longitude={longitude ? Number(longitude) : profile?.weather_longitude}
            focusLatitude={mapFocus?.latitude}
            focusLongitude={mapFocus?.longitude}
            focusZoom={mapFocus?.zoom}
            onPick={(coords) => {
              setLatitude(String(coords.latitude));
              setLongitude(String(coords.longitude));
              setMessage(locale === "tr" ? "Haritadan hava konumu seçildi." : "Weather location picked on map.");
            }}
          />
      </div>

      {profile?.weather_latitude && profile.weather_longitude ? (
        <p className="rounded-md bg-stone-50 px-2 py-1.5 text-xs font-semibold text-stone-700 dark:bg-stone-900 dark:text-stone-200">
          {locale === "tr" ? "Kayıtlı" : "Saved"}: {Number(profile.weather_latitude).toFixed(5)}, {Number(profile.weather_longitude).toFixed(5)}
        </p>
      ) : null}

      {message ? <p className="rounded-md bg-stone-50 px-2 py-1.5 text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-200">{message}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : locale === "tr" ? "Hava adresini kaydet" : "Save weather address"}
      </Button>
    </form>
  );
}
