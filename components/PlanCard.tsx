"use client";

import { CalendarDays, Sprout } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { planStatusLabel } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import type { Plan } from "@/types/database";
import { getCropSymbol } from "@/types/field";

export function PlanCard({ plan, fieldName }: { plan: Plan; fieldName?: string }) {
  const { locale } = useI18n();

  const statusTone: Record<string, string> = {
    pending: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    completed: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    cancelled: "border-red-400 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
  };

  return (
    <article className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="h-1 bg-gradient-to-r from-emerald-700 via-lime-500 to-amber-400" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-950 dark:text-stone-50">{plan.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
              <CalendarDays size={15} />
              {formatDate(plan.planned_date)}
            </p>
          </div>
          <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusTone[plan.status] ?? "border-stone-300 bg-stone-100 text-stone-700"}`}>
            {planStatusLabel(plan.status, locale)}
          </span>
        </div>
        <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
          {fieldName || (locale === "tr" ? "Tarla seçilmedi" : "No field selected")} -{" "}
          {plan.plan_type || (locale === "tr" ? "İşlem" : "Operation")}
        </p>
        {plan.planned_crop ? (
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            <Sprout size={15} />
            <span>
              {getCropSymbol(plan.planned_crop)} {plan.planned_crop}
            </span>
          </p>
        ) : null}
        {plan.notes ? <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{plan.notes}</p> : null}
      </div>
    </article>
  );
}
