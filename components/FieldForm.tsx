"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/FormInput";
import { LocationSelect, type SelectedLocation } from "@/components/LocationSelect";
import { MapPicker } from "@/components/MapPicker";
import { useI18n } from "@/lib/i18n";
import { requireSupabase } from "@/lib/supabaseClient";
import { areaUnits, crops } from "@/types/field";

type GeocodeResponse = {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};

async function geocodeSelectedLocation(form: FormData) {
  const city = String(form.get("city") || "");
  const district = String(form.get("district") || "");
  const neighborhood = String(form.get("neighborhood") || "");
  if (!city || !district) return null;

  const params = new URLSearchParams({ city, district, neighborhood });
  const response = await fetch(`/api/locations/geocode?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodeResponse;
  return data.location ?? null;
}

export function FieldForm() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordinateSource, setCoordinateSource] = useState<"gps" | "map_pin" | "">("");
  const [locationStatus, setLocationStatus] = useState("");
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

  function useCurrentLocation() {
    setLocationStatus("");

    if (!navigator.geolocation) {
      setLocationStatus(locale === "tr" ? "Tarayıcı konum desteği sunmuyor." : "Browser location is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setCoordinateSource("gps");
        setLocationStatus(locale === "tr" ? "Konum alındı." : "Location captured.");
      },
      () => {
        setLocationStatus(
          locale === "tr"
            ? "Konum alınamadı. Tarayıcı iznini kontrol edin. Kaydederken seçili adrese göre yaklaşık koordinat alınacak."
            : "Could not get location. Approximate coordinates will be fetched from the selected address when saving.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const supabase = requireSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setLoading(false);
      setError(
        locale === "tr"
          ? "Oturum bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın."
          : "Session not found. Please log out and log in again.",
      );
      return;
    }

    let lat = Number(form.get("latitude")) || null;
    let lon = Number(form.get("longitude")) || null;
    let locationSource = lat && lon ? coordinateSource || "gps" : "administrative_select";

    if (!lat || !lon) {
      const geocoded = await geocodeSelectedLocation(form);
      if (geocoded) {
        lat = geocoded.latitude;
        lon = geocoded.longitude;
        locationSource = "geocoded_administrative";
      }
    }

    const payload = {
      user_id: userData.user.id,
      name: String(form.get("name") || ""),
      city: String(form.get("city") || ""),
      city_code: String(form.get("city_code") || "") || null,
      district: String(form.get("district") || ""),
      district_code: String(form.get("district_code") || "") || null,
      neighborhood: String(form.get("neighborhood") || "") || null,
      neighborhood_code: String(form.get("neighborhood_code") || "") || null,
      latitude: lat,
      longitude: lon,
      location_source: locationSource,
      block_no: String(form.get("block_no") || "") || null,
      parcel_no: String(form.get("parcel_no") || "") || null,
      area: Number(form.get("area")) || null,
      area_unit: String(form.get("area_unit") || "dekar"),
      current_crop: String(form.get("current_crop") || "") || null,
      planting_date: String(form.get("planting_date") || "") || null,
      notes: String(form.get("notes") || "") || null,
    };

    const { error } = await supabase.from("fields").insert(payload);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/fields");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <FormInput name="name" label={t("fieldName")} required />

      <LocationSelect onLocationChange={updateMapFocus} />

      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />
      <div className="rounded-lg border border-stone-300 bg-stone-50 p-3 dark:border-stone-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">{locale === "tr" ? "Konum koordinatı" : "Location coordinates"}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {latitude && longitude
                ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
                : locale === "tr"
                  ? "GPS kullanılırsa hava durumu daha doğru olur. GPS alınamazsa seçili adrese göre yaklaşık koordinat kaydedilir."
                  : "GPS gives better weather accuracy. If unavailable, approximate coordinates will be saved from the selected address."}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={useCurrentLocation}>
            {locale === "tr" ? "Mevcut konumumu kullan" : "Use current location"}
          </Button>
          <MapPicker
            latitude={latitude ? Number(latitude) : null}
            longitude={longitude ? Number(longitude) : null}
            focusLatitude={mapFocus?.latitude}
            focusLongitude={mapFocus?.longitude}
            focusZoom={mapFocus?.zoom}
            onPick={(coords) => {
              setLatitude(String(coords.latitude));
              setLongitude(String(coords.longitude));
              setCoordinateSource("map_pin");
              setLocationStatus(locale === "tr" ? "Haritadan konum seçildi." : "Location picked on map.");
            }}
          />
        </div>
        {locationStatus ? <p className="mt-3 text-sm font-semibold text-emerald-900">{locationStatus}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormInput name="block_no" label={t("blockNo")} />
        <FormInput name="parcel_no" label={t("parcelNo")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormInput name="area" label={t("area")} type="number" step="0.01" />
        <FormSelect name="area_unit" label={t("areaUnit")} defaultValue="dekar">
          {areaUnits.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormSelect name="current_crop" label={t("currentCrop")} required>
          <option value="">{locale === "tr" ? "Ürün seçin" : "Select crop"}</option>
          {crops.map((crop) => (
            <option key={crop.value} value={crop.value}>
              {crop.symbol} {crop.label}
            </option>
          ))}
        </FormSelect>
        <FormInput name="planting_date" label={t("plantingDate")} type="date" />
      </div>
      <FormTextarea name="notes" label={t("notes")} />
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t("saving") : t("saveField")}
      </Button>
    </form>
  );
}
