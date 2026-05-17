"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CloudSun, MapPinned, ShieldCheck, Sprout, Wheat } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthLanding({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const { locale, t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const tr = locale === "tr";

  useEffect(() => {
    document.documentElement.classList.add("auth-page");
    document.body.classList.add("auth-page");

    return () => {
      document.documentElement.classList.remove("auth-page");
      document.body.classList.remove("auth-page");
    };
  }, []);

  return (
    <main className="auth-landing relative min-h-dvh overflow-x-hidden bg-stone-950 text-white">
      <div className="absolute inset-0 bg-[url('/images/harman-field-hero.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,22,0.88)_0%,rgba(6,78,59,0.66)_34%,rgba(28,25,23,0.34)_58%,rgba(3,29,22,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(255,255,255,0.20),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.38))]" />

      <section className="relative mx-auto grid min-h-dvh max-w-7xl content-center gap-8 px-5 py-20 lg:grid-cols-[minmax(0,0.94fr)_minmax(420px,0.66fr)] lg:items-center lg:py-10 xl:gap-14">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-50 shadow-lg backdrop-blur-md">
            <Sprout size={13} />
            {tr ? "Tarla takip deneyimi" : "Farm tracking experience"}
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight drop-shadow-xl sm:text-6xl xl:text-7xl">
            Harman
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-emerald-50/94 drop-shadow xl:text-xl xl:leading-9">
            {tr
              ? "Tarlalarınızı, ekili ürünleri, işlemleri, planları ve hava risklerini telefonda sade ama güçlü bir panelden yönetin."
              : "Manage fields, crops, operations, plans and weather risks from a clean but powerful mobile panel."}
          </p>

          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <GlassMetric icon={<MapPinned size={14} />} label={tr ? "Konum" : "Location"} value="81 il" />
            <GlassMetric icon={<Wheat size={14} />} label={tr ? "Ürün" : "Crop"} value="40+" />
            <GlassMetric icon={<CalendarCheck size={14} />} label={tr ? "Plan" : "Plan"} value="Akış" />
            <GlassMetric icon={<CloudSun size={14} />} label={tr ? "Hava" : "Weather"} value="8 gün" />
          </div>

          <div className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-3">
            <InfoChip icon={<ShieldCheck size={14} />} text={tr ? "RLS ile kişisel veri ayrımı" : "Private data with RLS"} />
            <InfoChip icon={<MapPinned size={14} />} text={tr ? "Haritadan konum seçimi" : "Map-based location pick"} />
            <InfoChip icon={<CloudSun size={14} />} text={tr ? "Risk odaklı hava notları" : "Risk-aware weather notes"} />
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/14 bg-stone-950/24 p-4 shadow-2xl shadow-stone-950/30 backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-100/10 to-transparent" />
          <div className="relative">
            <div className="grid grid-cols-2 rounded-2xl border border-white/12 bg-stone-950/22 p-1.5 text-base font-black">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn("rounded-xl px-3 py-2 transition", mode === "login" ? "bg-emerald-50 text-emerald-950 shadow" : "text-emerald-50/88 hover:bg-white/10")}
              >
                {t("login")}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={cn("rounded-xl px-3 py-2 transition", mode === "register" ? "bg-emerald-50 text-emerald-950 shadow" : "text-emerald-50/88 hover:bg-white/10")}
              >
                {t("register")}
              </button>
            </div>

            <div className="mt-5 overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: mode === "login" ? "translateX(0%)" : "translateX(-100%)" }}
              >
                <div className="w-full shrink-0">
                  <PanelHeader
                    title={t("login")}
                    text={tr ? "Hesabınıza dönün, son işleri kaçırmayın." : "Return to your account and keep work moving."}
                  />
                  <AuthForm mode="login" glass />
                </div>
                <div className="w-full shrink-0">
                  <PanelHeader
                    title={t("register")}
                    text={tr ? "İlk tarlanızı eklemek için hesabınızı oluşturun." : "Create your account to add your first field."}
                  />
                  <AuthForm mode="register" glass />
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-semibold text-emerald-50/85">
              {mode === "login" ? (
                <>
                  {tr ? "Hesabınız yok mu?" : "No account?"}{" "}
                  <button type="button" onClick={() => setMode("register")} className="font-black text-white underline-offset-4 hover:underline">
                    {t("registerNow")}
                  </button>
                </>
              ) : (
                <>
                  {tr ? "Zaten hesabınız var mı?" : "Already have an account?"}{" "}
                  <button type="button" onClick={() => setMode("login")} className="font-black text-white underline-offset-4 hover:underline">
                    {t("loginNow")}
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function PanelHeader({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Harman</p>
      <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      <p className="mt-1 text-base text-emerald-50/86">{text}</p>
    </div>
  );
}

function GlassMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/12 p-3 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-emerald-50/80">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function InfoChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/16 bg-stone-950/18 px-3 py-2.5 text-sm font-bold text-emerald-50 backdrop-blur-md">
      <span className="text-emerald-200">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
