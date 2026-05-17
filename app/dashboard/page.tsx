"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarCheck, ClipboardList, MapPinned, Plus, Sprout, TrendingUp, Wheat } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { DashboardWeather } from "@/components/DashboardWeather";
import { OperationHistory } from "@/components/OperationHistory";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import { areaToDekar, formatDate } from "@/lib/utils";
import { getWeatherSummaryForLocation, profileToWeatherLocation } from "@/lib/weather";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field, FieldOperation, Plan, Profile } from "@/types/database";
import { getCropSymbol } from "@/types/field";
import type { WeatherSummary } from "@/types/weather";

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => <Dashboard userId={user.id} />}
    </AuthGuard>
  );
}

function Dashboard({ userId }: { userId: string }) {
  const { locale, t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [operations, setOperations] = useState<FieldOperation[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = requireSupabase();
      const [fieldsResult, plansResult, operationsResult, profileResult] = await Promise.all([
        supabase.from("fields").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("plans").select("*").eq("user_id", userId).eq("status", "pending").order("planned_date", { ascending: true }),
        supabase
          .from("field_operations")
          .select("*")
          .eq("user_id", userId)
          .order("operation_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ]);

      setFields((fieldsResult.data ?? []) as Field[]);
      setPlans((plansResult.data ?? []) as Plan[]);
      setOperations((operationsResult.data ?? []) as FieldOperation[]);

      const weatherLocation = profileToWeatherLocation(profileResult.data as Profile | null);
      if (weatherLocation) {
        try {
          setWeather(await getWeatherSummaryForLocation(weatherLocation));
        } catch {
          setWeather(null);
        }
      }
      setLoading(false);
    }

    load();
  }, [userId]);

  const totalDekar = fields.reduce((sum, field) => sum + areaToDekar(field), 0);
  const pendingPlans = plans.slice(0, 5);

  const analytics = useMemo(() => {
    const cropMap = new Map<string, { count: number; dekar: number }>();
    let unplanted = 0;

    fields.forEach((field) => {
      if (!field.current_crop) {
        unplanted += 1;
        return;
      }
      const current = cropMap.get(field.current_crop) ?? { count: 0, dekar: 0 };
      current.count += 1;
      current.dekar += areaToDekar(field);
      cropMap.set(field.current_crop, current);
    });

    const fertilizedIds = new Set(operations.filter((operation) => operation.operation_type === "Gübreleme").map((operation) => operation.field_id));
    const fertilizerPlannedIds = new Set(
      plans.filter((plan) => plan.plan_type === "Gübreleme").map((plan) => plan.field_id).filter(Boolean) as string[],
    );
    const sprayedIds = new Set(operations.filter((operation) => operation.operation_type === "İlaçlama").map((operation) => operation.field_id));
    const irrigatedIds = new Set(operations.filter((operation) => operation.operation_type === "Sulama").map((operation) => operation.field_id));
    const harvestPlans = plans.filter((plan) => plan.plan_type === "Hasat").length;

    return {
      crops: Array.from(cropMap.entries())
        .map(([crop, value]) => ({ crop, ...value }))
        .sort((a, b) => b.dekar - a.dekar),
      unplanted,
      fertilized: fertilizedIds.size,
      fertilizerPlanned: fertilizerPlannedIds.size,
      fertilizerMissing: fields.filter((field) => !fertilizedIds.has(field.id) && !fertilizerPlannedIds.has(field.id)).length,
      sprayed: sprayedIds.size,
      irrigated: irrigatedIds.size,
      harvestPlans,
    };
  }, [fields, operations, plans]);

  if (loading) return <main className="mx-auto max-w-6xl px-3 py-6">{t("loading")}</main>;

  return (
    <main className="mx-auto max-w-7xl px-2.5 pb-20 pt-2.5 sm:px-3 md:pb-8">
      <PageHeader
        title={t("dashboard")}
        description={locale === "tr" ? "Tarlalarınız, planlarınız, işlemleriniz ve hava özeti." : "Your fields, plans, operations and weather summary."}
        action={
          <Button href="/fields/new">
            <Plus size={18} /> {locale === "tr" ? "Tarla" : "Field"}
          </Button>
        }
      />

      <section className="mt-3 overflow-hidden rounded-xl border border-emerald-950/15 bg-[#073b2f] text-white shadow-lg dark:border-emerald-500/20">
        <div className="grid gap-2 bg-[radial-gradient(circle_at_8%_20%,rgba(52,211,153,0.34),transparent_26%),linear-gradient(135deg,rgba(6,78,59,0.98),rgba(20,83,45,0.92)_48%,rgba(28,25,23,0.96))] p-3 md:grid-cols-[1fr_330px] md:p-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">
              {locale === "tr" ? "Çiftlik özeti" : "Farm overview"}
            </p>
            <h2 className="mt-1 text-base font-black sm:text-lg">
              {locale === "tr" ? `${fields.length} tarla, ${totalDekar.toFixed(1)} dekar takipte` : `${fields.length} fields, ${totalDekar.toFixed(1)} decares tracked`}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-emerald-50 sm:text-sm">
              {locale === "tr"
                ? "Ürün dağılımı, bekleyen planlar ve son işlemler tek ekranda küçük ama okunaklı kartlarla özetlenir."
                : "Crop distribution, pending plans and recent operations are summarized in compact cards."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <HeroChip icon={<Wheat size={16} />} label={locale === "tr" ? "Ekili" : "Planted"} value={fields.length - analytics.unplanted} />
            <HeroChip icon={<ClipboardList size={16} />} label={locale === "tr" ? "Plan" : "Plans"} value={plans.length} />
            <HeroChip icon={<Activity size={16} />} label={locale === "tr" ? "İşlem" : "Ops"} value={operations.length} />
          </div>
        </div>
      </section>

      <section className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 lg:grid-cols-4">
        <Stat icon={<MapPinned size={18} />} label={locale === "tr" ? "Toplam tarla" : "Total fields"} value={fields.length} tone="emerald" />
        <Stat icon={<Sprout size={18} />} label={locale === "tr" ? "Toplam alan" : "Total area"} value={`${totalDekar.toFixed(1)} dekar`} tone="amber" />
        <Stat icon={<Wheat size={18} />} label={locale === "tr" ? "Ekili tarla" : "Planted fields"} value={fields.length - analytics.unplanted} tone="lime" />
        <Stat icon={<CalendarCheck size={18} />} label={locale === "tr" ? "Bekleyen plan" : "Pending plans"} value={plans.length} tone="sky" />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-base font-bold">{locale === "tr" ? "Toplam tarla analizi" : "Field analytics"}</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {locale === "tr"
                  ? "Ürün dağılımı ve işlem kayıtlarına göre genel takip özeti."
                  : "Overview based on crop distribution and operation records."}
              </p>
            </div>
            <Button href="/fields" variant="secondary">
              {locale === "tr" ? "Tarlaları aç" : "Open fields"}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
            <MiniStat label={locale === "tr" ? "Ekili olmayan" : "Unplanted"} value={analytics.unplanted} accent="bg-stone-400" />
            <MiniStat label={locale === "tr" ? "Gübre atılan" : "Fertilized"} value={analytics.fertilized} accent="bg-emerald-600" />
            <MiniStat label={locale === "tr" ? "Gübre planlı" : "Fertilizer planned"} value={analytics.fertilizerPlanned} accent="bg-amber-500" />
            <MiniStat label={locale === "tr" ? "Gübre takibi eksik" : "Needs fertilizer tracking"} value={analytics.fertilizerMissing} accent="bg-red-500" />
            <MiniStat label={locale === "tr" ? "İlaçlama kaydı" : "Spraying records"} value={analytics.sprayed} accent="bg-sky-500" />
            <MiniStat label={locale === "tr" ? "Sulama kaydı" : "Irrigation records"} value={analytics.irrigated} accent="bg-cyan-500" />
            <MiniStat label={locale === "tr" ? "Hasat planı" : "Harvest plans"} value={analytics.harvestPlans} accent="bg-lime-600" />
            <MiniStat label={locale === "tr" ? "Ürün çeşidi" : "Crop types"} value={analytics.crops.length} accent="bg-violet-500" />
          </div>

          <div className="mt-4">
            <h3 className="font-bold">{locale === "tr" ? "Ürünlere göre alan" : "Area by crop"}</h3>
            <div className="mt-3 grid gap-2">
              {analytics.crops.length ? (
                analytics.crops.map((item) => (
                  <div key={item.crop} className="rounded-lg bg-stone-50 p-3 dark:bg-stone-950">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">
                        {getCropSymbol(item.crop)} {item.crop}
                      </p>
                      <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                        {item.count} {locale === "tr" ? "tarla" : "fields"} - {item.dekar.toFixed(1)} dekar
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-lime-500"
                        style={{ width: `${totalDekar > 0 ? Math.max(4, Math.min(100, (item.dekar / totalDekar) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-950 dark:text-stone-400">
                  {locale === "tr" ? "Henüz ekili ürün bilgisi yok." : "No crop information yet."}
                </p>
              )}
            </div>
          </div>
        </div>

        {weather ? (
          <DashboardWeather summary={weather} />
        ) : (
          <div className="rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
            {locale === "tr"
              ? "Hava özeti için Ayarlar bölümünden hava durumu adresi seçin."
              : "Select a weather address in Settings to see weather summary."}
            <Button href="/settings" variant="secondary" className="mt-3">
              {locale === "tr" ? "Ayarları aç" : "Open settings"}
            </Button>
          </div>
        )}
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-base font-bold">{locale === "tr" ? "Yaklaşan işler" : "Upcoming tasks"}</h2>
          <div className="mt-4 space-y-3">
            {pendingPlans.length ? (
              pendingPlans.map((plan) => (
                <div key={plan.id} className="rounded-lg bg-stone-50 p-3 dark:bg-stone-950">
                  <p className="font-bold">{plan.title}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {formatDate(plan.planned_date)} - {plan.plan_type || (locale === "tr" ? "İşlem" : "Operation")}
                    {plan.planned_crop ? ` - ${getCropSymbol(plan.planned_crop)} ${plan.planned_crop}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400">{locale === "tr" ? "Bekleyen plan yok." : "No pending plans."}</p>
            )}
          </div>
        </div>

        <OperationHistory
          title={locale === "tr" ? "Son işlemler" : "Latest operations"}
          operations={operations}
          fields={fields}
          maxItems={5}
          maxHeightClass="max-h-[285px]"
          onDeleted={() => window.location.reload()}
        />
      </section>
    </main>
  );
}

function HeroChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="rounded-lg border border-white/15 bg-white/12 p-2 backdrop-blur sm:p-3">
      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-50 sm:gap-1.5 sm:text-xs">{icon}{label}</div>
      <p className="mt-1 text-base font-black sm:mt-1.5 sm:text-lg">{value}</p>
    </article>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: "emerald" | "amber" | "lime" | "sky" }) {
  const tones = {
    emerald: "from-emerald-700 to-teal-500",
    amber: "from-amber-600 to-yellow-400",
    lime: "from-lime-700 to-emerald-400",
    sky: "from-sky-700 to-cyan-400",
  };

  return (
    <article className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className={`h-1 bg-gradient-to-r ${tones[tone]}`} />
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="text-emerald-800 dark:text-emerald-300">{icon}</div>
          <TrendingUp size={14} className="text-stone-400" />
        </div>
        <p className="mt-1.5 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 sm:text-xs">{label}</p>
        <p className="mt-0.5 text-base font-black sm:text-lg">{value}</p>
      </div>
    </article>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <article className="rounded-lg bg-stone-50 p-2.5 dark:bg-stone-950 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{label}</p>
        <span className={`size-2.5 rounded-full ${accent}`} />
      </div>
      <p className="mt-0.5 text-base font-black sm:text-lg">{value}</p>
    </article>
  );
}
