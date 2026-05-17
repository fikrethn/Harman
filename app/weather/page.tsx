"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Leaf,
  MapPin,
  Settings,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { Button } from "@/components/Button";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import { getWeatherSummaryForLocation, profileToWeatherLocation } from "@/lib/weather";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/database";
import type { WeatherSummary } from "@/types/weather";

export default function WeatherPage() {
  return (
    <AuthGuard>
      {(user) => <Weather userId={user.id} />}
    </AuthGuard>
  );
}

function Weather({ userId }: { userId: string }) {
  const { locale, t } = useI18n();
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [hasWeatherAddress, setHasWeatherAddress] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await requireSupabase().from("profiles").select("*").eq("id", userId).single();
      const location = profileToWeatherLocation(data as Profile | null);
      setHasWeatherAddress(Boolean(location));

      if (location) {
        try {
          setSummary(await getWeatherSummaryForLocation(location));
        } catch {
          setSummary(null);
        }
      }

      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <main className="mx-auto max-w-7xl px-3 pb-20 pt-3 md:pb-8">
      <PageHeader
        title={locale === "tr" ? "Hava Durumu" : "Weather"}
        description={
          locale === "tr"
            ? "Tahminler ayarlarda seçtiğiniz hava adresine göre gösterilir. Tarımsal kararlar için öneri niteliğindedir."
            : "Forecasts use the weather address selected in settings. Agricultural notes are suggestions."
        }
        action={
          <Button href="/settings" variant="secondary">
            <Settings size={16} />
            {locale === "tr" ? "Hava adresi" : "Weather address"}
          </Button>
        }
      />

      {loading ? <p className="mt-4 text-stone-600 dark:text-stone-300">{t("loading")}</p> : null}

      {!loading && !hasWeatherAddress ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.35),transparent_28%),linear-gradient(135deg,#064e3b,#0f766e_48%,#1c1917)] p-4 text-white">
            <MapPin size={24} />
            <h2 className="mt-3 text-lg font-black">{locale === "tr" ? "Önce hava adresini seçelim" : "Select a weather address first"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50">
              {locale === "tr"
                ? "Hava sayfası tek bir referans konuma göre çalışır. Ayarlardan il, ilçe, mahalle veya harita noktası seçin."
                : "The weather page uses one reference location. Pick a province, district, neighborhood or map point in settings."}
            </p>
            <Button href="/settings" className="mt-4">
              {locale === "tr" ? "Ayarları aç" : "Open settings"}
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && hasWeatherAddress && summary ? <WeatherShowcase summary={summary} /> : null}

      {!loading && hasWeatherAddress && !summary ? (
        <div className="mt-4 rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
          {locale === "tr" ? "Hava durumu alınamadı. Hava durumu adresini kontrol edin." : "Weather could not be loaded. Check your weather address."}
        </div>
      ) : null}
    </main>
  );
}

function WeatherShowcase({ summary }: { summary: WeatherSummary }) {
  const { locale } = useI18n();
  const condition = weatherCondition(summary.weatherCode, summary.isDay);
  const sprayScore = useMemo(() => getSprayScore(summary), [summary]);
  const rainLevel = clamp(summary.precipitationProbability ?? 0, 0, 100);
  const windLevel = clamp(((summary.maxWind24h ?? summary.windSpeed ?? 0) / 45) * 100, 0, 100);
  const frostLevel = summary.minTemperature24h !== null && summary.minTemperature24h < 0 ? 88 : summary.minTemperature24h !== null && summary.minTemperature24h < 3 ? 52 : 12;

  return (
    <div className="mt-4 grid gap-3">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-950/20 bg-[#053d2f] text-white shadow-xl dark:border-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.34),transparent_24%),linear-gradient(135deg,rgba(6,78,59,0.95),rgba(15,118,110,0.88)_48%,rgba(28,25,23,0.98))]" />
        <div className="absolute -right-16 -top-16 size-44 rounded-full bg-amber-200/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-stone-950/35 to-transparent" />

        <div className="relative grid gap-4 p-4 lg:grid-cols-[1fr_340px] lg:p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-50">
              <MapPin size={16} />
              <span>{summary.locationName}</span>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-xl bg-white/15 text-3xl shadow-inner backdrop-blur">{condition.symbol}</div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">{condition.labelTr}</p>
                  <h2 className="mt-1 text-4xl font-black leading-none">{value(summary.temperature, "°")}</h2>
                </div>
              </div>
              <div className="pb-1 text-sm text-emerald-50">
                <p>{locale === "tr" ? "Hissedilen" : "Feels like"}: {value(summary.apparentTemperature, "°C")}</p>
                <p>{locale === "tr" ? "24s aralık" : "24h range"}: {value(summary.minTemperature24h, "°C")} / {value(summary.maxTemperature24h, "°C")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/12 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">{locale === "tr" ? "İlaçlama uygunluğu" : "Spraying outlook"}</p>
                <p className="mt-1 text-lg font-black">{sprayScore.label}</p>
              </div>
              <div className="grid size-11 place-items-center rounded-full bg-white/15 text-base font-black">{sprayScore.score}</div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className={`h-full rounded-full ${sprayScore.bar}`} style={{ width: `${sprayScore.score}%` }} />
            </div>
            <p className="mt-3 text-sm text-emerald-50">{sprayScore.description}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <RiskCard icon={<CloudRain size={19} />} label={locale === "tr" ? "Yağış riski" : "Rain risk"} value={rainLevel} detail={value(summary.precipitationProbability, "%")} tone="rain" />
        <RiskCard icon={<Wind size={19} />} label={locale === "tr" ? "Rüzgar etkisi" : "Wind impact"} value={windLevel} detail={value(summary.maxWind24h, " km/s")} tone="wind" />
        <RiskCard icon={<Thermometer size={19} />} label={locale === "tr" ? "Don riski" : "Frost risk"} value={frostLevel} detail={value(summary.minTemperature24h, "°C")} tone="frost" />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">{locale === "tr" ? "Önümüzdeki saatler" : "Next hours"}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">{locale === "tr" ? "Sıcaklık, yağış ve rüzgarın kısa vadeli akışı." : "Short-term flow of temperature, rain and wind."}</p>
            </div>
            <Sun size={20} className="text-amber-500" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {summary.hourly.map((hour) => (
              <HourTile key={hour.time} hour={hour} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-base font-black">{locale === "tr" ? "Tarımsal yorum" : "Agricultural notes"}</h2>
          <div className="mt-3 grid gap-2">
            {summary.messages.map((message) => (
              <div key={message} className="flex gap-2 rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <p>{message}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            {locale === "tr"
              ? "Bu yorumlar öneridir; yerel koşulları ve resmi uyarıları kontrol edin."
              : "These notes are suggestions; check local conditions and official warnings."}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black">{locale === "tr" ? "8 günlük görünüm" : "8-day outlook"}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {locale === "tr" ? "Gelecek günler için sıcaklık, yağış ve rüzgar özeti." : "Temperature, rain and wind summary for upcoming days."}
            </p>
          </div>
          <CloudRain size={20} className="text-sky-500" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {summary.daily.map((day) => (
            <DayTile key={day.date} day={day} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Droplets size={17} />} label={locale === "tr" ? "Nem" : "Humidity"} value={value(summary.humidity, "%")} />
        <Metric icon={<Gauge size={17} />} label={locale === "tr" ? "Basınç" : "Pressure"} value={value(summary.pressure, " hPa")} />
        <Metric icon={<Eye size={17} />} label={locale === "tr" ? "Görüş" : "Visibility"} value={summary.visibility ? value(summary.visibility / 1000, " km") : "-"} />
        <Metric icon={<Compass size={17} />} label={locale === "tr" ? "Rüzgar yönü" : "Wind direction"} value={windDirectionLabel(summary.windDirection)} />
        <Metric icon={<CloudRain size={17} />} label={locale === "tr" ? "Anlık yağış" : "Precipitation"} value={value(summary.precipitation, " mm")} />
        <Metric icon={<Wind size={17} />} label={locale === "tr" ? "Rüzgar" : "Wind"} value={value(summary.windSpeed, " km/s")} />
        <Metric icon={<Leaf size={17} />} label={locale === "tr" ? "Toprak nemi" : "Soil moisture"} value={value(summary.soilMoisture, " m³/m³")} />
        <Metric icon={<Thermometer size={17} />} label={locale === "tr" ? "Toprak sıcaklığı" : "Soil temp."} value={value(summary.soilTemperature, "°C")} />
      </section>
    </div>
  );
}

function DayTile({ day }: { day: WeatherSummary["daily"][number] }) {
  const date = new Date(day.date);
  const rain = clamp(day.precipitationProbability ?? 0, 0, 100);
  const wind = clamp(((day.maxWind ?? 0) / 45) * 100, 0, 100);

  return (
    <article className="rounded-lg bg-stone-50 p-2.5 dark:bg-stone-950">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase text-stone-500 dark:text-stone-400">
            {date.toLocaleDateString("tr-TR", { weekday: "short" })}
          </p>
          <p className="mt-0.5 text-sm font-bold">{date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</p>
        </div>
        <span className="text-xl">{weatherCondition(day.weatherCode, true).symbol}</span>
      </div>
      <p className="mt-2 text-base font-black">{value(day.minTemperature, "°")} / {value(day.maxTemperature, "°")}</p>
      <div className="mt-2 grid gap-1.5">
        <TinyBar label="Yağış" value={rain} text={value(day.precipitationProbability, "%")} color="bg-sky-500" />
        <TinyBar label="Rüzgar" value={wind} text={value(day.maxWind, " km/s")} color="bg-emerald-600" />
      </div>
    </article>
  );
}

function TinyBar({ label, value, text, color }: { label: string; value: number; text: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
        <span>{label}</span>
        <span>{text}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RiskCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: "rain" | "wind" | "frost" }) {
  const color = tone === "rain" ? "from-sky-500 to-cyan-300" : tone === "wind" ? "from-emerald-500 to-lime-300" : "from-indigo-500 to-sky-200";

  return (
    <article className="rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-stone-200">
          <span className="grid size-8 place-items-center rounded-lg bg-stone-100 text-emerald-800 dark:bg-stone-800 dark:text-emerald-300">{icon}</span>
          {label}
        </div>
        <span className="text-sm font-black">{detail}</span>
      </div>
      <div className="mt-3 h-16 rounded-xl bg-stone-100 p-2 dark:bg-stone-950">
        <div className="flex h-full items-end gap-1">
          {[35, 58, 45, 72, value, 52, 64].map((bar, index) => (
            <span key={index} className={`flex-1 rounded-t-md bg-gradient-to-t ${color}`} style={{ height: `${Math.max(10, Math.min(100, bar))}%`, opacity: index === 4 ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
    </article>
  );
}

function HourTile({ hour }: { hour: WeatherSummary["hourly"][number] }) {
  const date = new Date(hour.time);
  const rain = clamp(hour.precipitationProbability ?? 0, 0, 100);

  return (
    <article className="rounded-lg bg-stone-50 p-2.5 text-sm dark:bg-stone-950">
      <p className="text-xs font-bold text-stone-500 dark:text-stone-400">{date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
      <p className="mt-1.5 text-lg font-black">{value(hour.temperature, "°")}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${rain}%` }} />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400">Yağış {value(hour.precipitationProbability, "%")}</p>
      <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">Rüzgar {value(hour.windSpeed, " km/s")}</p>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
        <span className="text-emerald-800 dark:text-emerald-300">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </article>
  );
}

function value(input: number | null | undefined, suffix = "") {
  if (input === null || input === undefined || Number.isNaN(input)) return "-";
  return `${Number(input).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}${suffix}`;
}

function clamp(input: number, min: number, max: number) {
  return Math.max(min, Math.min(max, input));
}

function weatherCondition(code: number | null, isDay: boolean | null) {
  if (code === null) return { symbol: isDay === false ? "🌙" : "☀️", labelTr: "Tahmin" };
  if ([0, 1].includes(code)) return { symbol: isDay === false ? "🌙" : "☀️", labelTr: "Açık" };
  if ([2, 3].includes(code)) return { symbol: "⛅", labelTr: "Parçalı bulutlu" };
  if ([45, 48].includes(code)) return { symbol: "🌫️", labelTr: "Sisli" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { symbol: "🌧️", labelTr: "Yağışlı" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { symbol: "❄️", labelTr: "Karlı" };
  if ([95, 96, 99].includes(code)) return { symbol: "⛈️", labelTr: "Fırtınalı" };
  return { symbol: "🌤️", labelTr: "Değişken" };
}

function getSprayScore(summary: WeatherSummary) {
  const rainPenalty = clamp(summary.precipitationProbability ?? 0, 0, 100) * 0.42;
  const windPenalty = clamp(((summary.maxWind24h ?? summary.windSpeed ?? 0) / 40) * 100, 0, 100) * 0.42;
  const frostPenalty = summary.minTemperature24h !== null && summary.minTemperature24h < 2 ? 16 : 0;
  const score = Math.round(clamp(100 - rainPenalty - windPenalty - frostPenalty, 8, 98));

  if (score >= 70) {
    return {
      score,
      label: "Uygun olabilir",
      description: "Yağış ve rüzgar riski düşük görünüyor. Yine de ürün etiketi ve yerel koşulları kontrol edin.",
      bar: "bg-emerald-300",
    };
  }

  if (score >= 40) {
    return {
      score,
      label: "Dikkatli olun",
      description: "Koşullar orta seviyede. Rüzgar, yağış ve ürün hassasiyetini birlikte değerlendirin.",
      bar: "bg-amber-300",
    };
  }

  return {
    score,
    label: "Risk olabilir",
    description: "Yağış, rüzgar veya düşük sıcaklık uygulamayı olumsuz etkileyebilir. Erteleme düşünülebilir.",
    bar: "bg-red-300",
  };
}

function windDirectionLabel(degree?: number | null) {
  if (degree === null || degree === undefined) return "-";
  const directions = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"];
  return `${directions[Math.round(degree / 45) % 8]} (${value(degree, "°")})`;
}
