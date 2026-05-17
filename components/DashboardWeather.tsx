"use client";

import { CloudRain, Droplets, Thermometer, Wind } from "lucide-react";
import type { WeatherSummary } from "@/types/weather";

function value(input: number | null | undefined, suffix = "") {
  if (input === null || input === undefined || Number.isNaN(input)) return "-";
  return `${Number(input).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}${suffix}`;
}

function weatherSymbol(code: number | null) {
  if (code === null) return "☀️";
  if ([0, 1].includes(code)) return "☀️";
  if ([2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

export function DashboardWeather({ summary }: { summary: WeatherSummary }) {
  return (
    <article className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="bg-gradient-to-r from-emerald-950 via-teal-800 to-sky-800 p-2.5 text-white sm:p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">Hava özeti</p>
            <h2 className="mt-1 line-clamp-1 text-base font-black">{summary.locationName}</h2>
          </div>
          <span className="text-2xl sm:text-3xl">{weatherSymbol(summary.weatherCode)}</span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-2xl font-black leading-none sm:text-3xl">{value(summary.temperature, "°")}</p>
          <p className="pb-0.5 text-xs text-emerald-50 sm:pb-1 sm:text-sm">Hissedilen {value(summary.apparentTemperature, "°C")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <Mini icon={<Droplets size={15} />} label="Nem" value={value(summary.humidity, "%")} />
        <Mini icon={<Wind size={15} />} label="Rüzgar" value={value(summary.windSpeed, " km/s")} />
        <Mini icon={<CloudRain size={15} />} label="Yağış riski" value={value(summary.precipitationProbability, "%")} />
        <Mini icon={<Thermometer size={15} />} label="24s min/max" value={`${value(summary.minTemperature24h, "°")} / ${value(summary.maxTemperature24h, "°")}`} />
      </div>

      <div className="border-t border-stone-200 px-2.5 py-2 dark:border-stone-800 sm:px-3 sm:py-2.5">
        <p className="text-xs font-black uppercase text-stone-500 dark:text-stone-400">Gelecek günler</p>
        <div className="mt-2 grid gap-1.5 sm:gap-2">
          {summary.daily.slice(1, 5).map((day) => (
            <div key={day.date} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md bg-stone-50 px-2 py-1.5 text-xs dark:bg-stone-950">
              <span className="font-bold">{new Date(day.date).toLocaleDateString("tr-TR", { weekday: "short", day: "2-digit" })}</span>
              <span>{weatherSymbol(day.weatherCode)}</span>
              <span className="font-bold">{value(day.minTemperature, "°")} / {value(day.maxTemperature, "°")}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 p-2 dark:bg-stone-950">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
        <span className="text-emerald-800 dark:text-emerald-300">{icon}</span>
        {label}
      </div>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}
