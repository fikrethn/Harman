"use client";

import { CalendarCheck, CloudSun, MapPinned, ShieldCheck, Sprout, Wheat } from "lucide-react";

type PreAuthShowcaseProps = {
  locale: string;
  mode: "home" | "login" | "register";
};

export function PreAuthShowcase({ locale, mode }: PreAuthShowcaseProps) {
  const tr = locale === "tr";
  const headline =
    mode === "register"
      ? tr
        ? "İlk kayıtla çiftlik düzenini kur."
        : "Build your farm order from the first record."
      : mode === "login"
        ? tr
          ? "Tarlalar, planlar ve hava tek ritimde."
          : "Fields, plans and weather in one rhythm."
        : tr
          ? "Tarımı küçük ekranlarda netleştiren takip paneli."
          : "A farm tracking panel made clear on small screens.";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-950/20 bg-[#063d31] p-3 text-white shadow-xl dark:border-emerald-500/20">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,78,59,0.96),rgba(15,118,110,0.84)_44%,rgba(120,53,15,0.58))]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/35 to-transparent" />

      <div className="relative grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Harman</p>
            <h2 className="mt-1 max-w-md text-xl font-black leading-tight">{headline}</h2>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/14 text-emerald-100 backdrop-blur">
            <Sprout size={19} />
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_0.78fr]">
          <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur">
            <div className="grid h-52 grid-cols-6 grid-rows-5 gap-1.5 sm:h-60">
              <FieldTile className="col-span-2 row-span-2 bg-lime-300/85" label="Buğday" />
              <FieldTile className="col-span-2 row-span-1 bg-amber-300/90" label="Nohut" />
              <FieldTile className="col-span-2 row-span-2 bg-emerald-300/85" label="Arpa" />
              <FieldTile className="col-span-1 row-span-2 bg-teal-300/80" label="Su" />
              <FieldTile className="col-span-3 row-span-2 bg-[#d9a45f]/90" label="Hasat" />
              <FieldTile className="col-span-2 row-span-1 bg-sky-200/85" label="Yağış" />
              <FieldTile className="col-span-2 row-span-1 bg-green-300/80" label="Plan" />
              <FieldTile className="col-span-2 row-span-2 bg-yellow-200/85" label="Takip" />
              <FieldTile className="col-span-2 row-span-1 bg-rose-200/80" label="Risk" />
              <FieldTile className="col-span-2 row-span-1 bg-emerald-200/85" label="Güven" />
            </div>
          </div>

          <div className="grid gap-2">
            <Metric icon={<MapPinned size={14} />} label={tr ? "Konumlu kayıt" : "Mapped records"} value="81" />
            <Metric icon={<CalendarCheck size={14} />} label={tr ? "Plan akışı" : "Plan flow"} value="7g" />
            <Metric icon={<CloudSun size={14} />} label={tr ? "Hava ufku" : "Weather view"} value="8g" />
            <Metric icon={<ShieldCheck size={14} />} label={tr ? "RLS güvenliği" : "RLS security"} value="aktif" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <PulseCard icon={<Wheat size={14} />} title={tr ? "Ürün takibi" : "Crop tracking"} text={tr ? "Ekim ve hasat geçmişi." : "Planting and harvest history."} />
          <PulseCard icon={<CloudSun size={14} />} title={tr ? "Risk uyarısı" : "Risk notes"} text={tr ? "Yağış, don, rüzgar." : "Rain, frost, wind."} />
          <PulseCard icon={<CalendarCheck size={14} />} title={tr ? "İş takvimi" : "Work calendar"} text={tr ? "Planlar ve işlemler." : "Plans and operations."} />
        </div>
      </div>
    </section>
  );
}

function FieldTile({ className, label }: { className: string; label: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg p-1.5 text-[10px] font-black text-emerald-950 shadow-sm ${className}`}>
      <span className="relative z-10">{label}</span>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[repeating-linear-gradient(135deg,rgba(6,78,59,0.10)_0_4px,transparent_4px_9px)]" />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/12 p-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase text-emerald-100">{label}</p>
        <span className="text-emerald-100">{icon}</span>
      </div>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function PulseCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/12 p-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-50">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-[11px] leading-4 text-emerald-50/85">{text}</p>
    </div>
  );
}
