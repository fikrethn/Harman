"use client";

import { Cloud, CloudRain, Eye, Gauge, Sun, Thermometer, Waves, Wind } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { WeatherSummary } from "@/types/weather";

function value(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}${suffix}`;
}

function windDirectionLabel(degree?: number | null) {
  if (degree === null || degree === undefined) return "-";
  const directions = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"];
  return directions[Math.round(degree / 45) % 8];
}

export function WeatherCard({ summary }: { summary: WeatherSummary }) {
  const { locale, t } = useI18n();

  const metrics = [
    { icon: Thermometer, label: locale === "tr" ? "Sıcaklık" : "Temperature", text: value(summary.temperature, " °C") },
    { icon: Thermometer, label: locale === "tr" ? "Hissedilen" : "Feels like", text: value(summary.apparentTemperature, " °C") },
    { icon: Waves, label: locale === "tr" ? "Nem" : "Humidity", text: value(summary.humidity, "%") },
    { icon: CloudRain, label: locale === "tr" ? "Yağış olasılığı" : "Rain chance", text: value(summary.precipitationProbability, "%") },
    { icon: CloudRain, label: locale === "tr" ? "Anlık yağış" : "Precipitation", text: value(summary.precipitation, " mm") },
    { icon: Wind, label: locale === "tr" ? "Rüzgar" : "Wind", text: value(summary.windSpeed, " km/s") },
    { icon: Wind, label: locale === "tr" ? "Rüzgar hamlesi" : "Gusts", text: value(summary.windGusts, " km/s") },
    { icon: Wind, label: locale === "tr" ? "Rüzgar yönü" : "Direction", text: `${windDirectionLabel(summary.windDirection)} (${value(summary.windDirection, "°")})` },
    { icon: Cloud, label: locale === "tr" ? "Bulutluluk" : "Cloud cover", text: value(summary.cloudCover, "%") },
    { icon: Gauge, label: locale === "tr" ? "Basınç" : "Pressure", text: value(summary.pressure, " hPa") },
    { icon: Sun, label: locale === "tr" ? "UV indeksi" : "UV index", text: value(summary.uvIndex) },
    { icon: Eye, label: locale === "tr" ? "Görüş" : "Visibility", text: summary.visibility ? value(summary.visibility / 1000, " km") : "-" },
    { icon: Thermometer, label: locale === "tr" ? "Toprak sıcaklığı" : "Soil temp.", text: value(summary.soilTemperature, " °C") },
    { icon: Waves, label: locale === "tr" ? "Toprak nemi" : "Soil moisture", text: value(summary.soilMoisture, " m³/m³") },
    { icon: Thermometer, label: locale === "tr" ? "24s min/max" : "24h min/max", text: `${value(summary.minTemperature24h, " °C")} / ${value(summary.maxTemperature24h, " °C")}` },
    { icon: Wind, label: locale === "tr" ? "24s max rüzgar" : "24h max wind", text: value(summary.maxWind24h, " km/s") },
  ];

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{summary.fieldName || t("weather")}</p>
        <h3 className="mt-1 text-base font-bold text-stone-950">{summary.locationName}</h3>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0 rounded-lg bg-stone-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                <Icon size={16} className="shrink-0 text-emerald-800" />
                <span className="truncate">{metric.label}</span>
              </div>
              <p className="mt-2 break-words font-black text-stone-950">{metric.text}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {summary.messages.map((message) => (
          <p key={message} className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        {locale === "tr"
          ? "Tahminler öneridir; yerel koşulları ve resmi uyarıları kontrol edin."
          : "Forecasts are suggestions; check local conditions and official warnings."}
      </p>
    </article>
  );
}
