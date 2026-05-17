import type { Field, Profile } from "@/types/database";
import type { WeatherSummary } from "@/types/weather";

type GeocodingResult = {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  admin2?: string;
};

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    cloud_cover?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    weather_code?: number;
    is_day?: number;
    uv_index?: number;
    visibility?: number;
    soil_temperature_0cm?: number;
    soil_moisture_0_to_1cm?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
};

export type WeatherLocation = {
  latitude: number;
  longitude: number;
  name: string;
  district?: string | null;
  city?: string | null;
  label?: string;
};

export function profileToWeatherLocation(profile: Profile | null): WeatherLocation | null {
  if (!profile?.weather_latitude || !profile.weather_longitude) return null;

  return {
    latitude: profile.weather_latitude,
    longitude: profile.weather_longitude,
    name: profile.weather_neighborhood || profile.weather_district || profile.weather_city || "Hava konumu",
    district: profile.weather_district,
    city: profile.weather_city,
    label: "Hava durumu konumu",
  };
}

export async function geocodeField(field: Field): Promise<GeocodingResult | null> {
  const queries = [
    [field.neighborhood, field.district, field.city, "Türkiye"].filter(Boolean).join(", "),
    [field.district, field.city, "Türkiye"].filter(Boolean).join(", "),
    [field.city, "Türkiye"].filter(Boolean).join(", "),
  ];

  for (const query of queries) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "tr");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) continue;

    const data = (await response.json()) as { results?: GeocodingResult[] };
    const location = data.results?.[0];
    if (location) return location;
  }

  return null;
}

function emptySummary(locationName: string, fieldName?: string): WeatherSummary {
  return {
    fieldName,
    locationName,
    temperature: null,
    apparentTemperature: null,
    humidity: null,
    windSpeed: null,
    windGusts: null,
    windDirection: null,
    precipitationProbability: null,
    precipitation: null,
    cloudCover: null,
    pressure: null,
    uvIndex: null,
    visibility: null,
    soilTemperature: null,
    soilMoisture: null,
    minTemperature24h: null,
    maxTemperature24h: null,
    maxWind24h: null,
    weatherCode: null,
    isDay: null,
    hourly: [],
    daily: [],
    messages: ["Konum bulunamadı. Hava durumu için ayarlardan hava durumu adresi belirleyin."],
  };
}

export async function getWeatherSummaryForLocation(location: WeatherLocation): Promise<WeatherSummary> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,is_day,uv_index,visibility,soil_temperature_0cm,soil_moisture_0_to_1cm",
  );
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  );
  url.searchParams.set("forecast_days", "8");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Hava durumu alınamadı.");
  }

  const data = (await response.json()) as ForecastResponse;
  const next24Rain = data.hourly?.precipitation_probability?.slice(0, 24) ?? [];
  const next24Temp = data.hourly?.temperature_2m?.slice(0, 24) ?? [];
  const next24Wind = data.hourly?.wind_speed_10m?.slice(0, 24) ?? [];

  const maxRain = next24Rain.length ? Math.max(...next24Rain) : null;
  const minTemp = next24Temp.length ? Math.min(...next24Temp) : null;
  const maxTemp = next24Temp.length ? Math.max(...next24Temp) : null;
  const maxWind = next24Wind.length ? Math.max(...next24Wind) : null;
  const messages: string[] = [];
  const hourly = (data.hourly?.time ?? []).slice(0, 12).map((time, index) => ({
    time,
    temperature: data.hourly?.temperature_2m?.[index] ?? null,
    precipitationProbability: data.hourly?.precipitation_probability?.[index] ?? null,
    windSpeed: data.hourly?.wind_speed_10m?.[index] ?? null,
  }));
  const daily = (data.daily?.time ?? []).slice(0, 8).map((date, index) => ({
    date,
    weatherCode: data.daily?.weather_code?.[index] ?? null,
    minTemperature: data.daily?.temperature_2m_min?.[index] ?? null,
    maxTemperature: data.daily?.temperature_2m_max?.[index] ?? null,
    precipitationProbability: data.daily?.precipitation_probability_max?.[index] ?? null,
    precipitation: data.daily?.precipitation_sum?.[index] ?? null,
    maxWind: data.daily?.wind_speed_10m_max?.[index] ?? null,
  }));

  if (maxRain !== null && maxRain >= 55) {
    messages.push("Yağış beklenebilir, gübreleme veya ilaçlama ertelenebilir.");
  }

  if (maxWind !== null && maxWind >= 28) {
    messages.push("Rüzgar yüksek olabilir, ilaçlama için uygun olmayabilir.");
  }

  if (minTemp !== null && minTemp < 0) {
    messages.push("Don riski olabilir.");
  }

  if ((maxRain ?? 0) < 35 && (maxWind ?? 0) < 20 && (minTemp ?? 5) >= 0) {
    messages.push("Hava sakin görünüyor, ilaçlama için uygun olabilir.");
  }

  if (!messages.length) {
    messages.push("Belirgin bir hava riski görünmüyor, yine de yerel koşulları kontrol edin.");
  }

  return {
    fieldName: location.label || "Hava durumu",
    locationName: [location.name, location.district, location.city].filter(Boolean).join(", "),
    weatherCode: data.current?.weather_code ?? null,
    isDay: data.current?.is_day === undefined ? null : data.current.is_day === 1,
    temperature: data.current?.temperature_2m ?? null,
    apparentTemperature: data.current?.apparent_temperature ?? null,
    humidity: data.current?.relative_humidity_2m ?? null,
    windSpeed: data.current?.wind_speed_10m ?? null,
    windGusts: data.current?.wind_gusts_10m ?? null,
    windDirection: data.current?.wind_direction_10m ?? null,
    precipitationProbability: maxRain,
    precipitation: data.current?.precipitation ?? null,
    cloudCover: data.current?.cloud_cover ?? null,
    pressure: data.current?.pressure_msl ?? null,
    uvIndex: data.current?.uv_index ?? null,
    visibility: data.current?.visibility ?? null,
    soilTemperature: data.current?.soil_temperature_0cm ?? null,
    soilMoisture: data.current?.soil_moisture_0_to_1cm ?? null,
    minTemperature24h: minTemp,
    maxTemperature24h: maxTemp,
    maxWind24h: maxWind,
    hourly,
    daily,
    messages,
  };
}

export async function getWeatherSummary(field: Field): Promise<WeatherSummary> {
  const directLocation =
    field.latitude && field.longitude
      ? {
          latitude: field.latitude,
          longitude: field.longitude,
          name: field.neighborhood || field.district,
          district: field.district,
          city: field.city,
          label: field.name,
        }
      : null;

  const geocoded = directLocation ? null : await geocodeField(field);
  const location = directLocation ?? (geocoded
    ? {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        name: geocoded.name,
        district: geocoded.admin2,
        city: geocoded.admin1,
        label: field.name,
      }
    : null);

  if (!location) {
    return emptySummary([field.district, field.city].filter(Boolean).join(", "), field.name);
  }

  return getWeatherSummaryForLocation(location);
}
