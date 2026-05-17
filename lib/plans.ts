import type { Field, Plan, PlanStatus } from "@/types/database";
import { getCropSymbol } from "@/types/field";
import { formatDate } from "@/lib/utils";

export function planStatusLabel(status: PlanStatus | string, locale: "tr" | "en") {
  const labels: Record<string, { tr: string; en: string }> = {
    pending: { tr: "Bekliyor", en: "Pending" },
    completed: { tr: "Tamamlandı", en: "Completed" },
    cancelled: { tr: "İptal edildi", en: "Cancelled" },
  };

  return labels[status]?.[locale] ?? status;
}

export function planTypeLabel(planType: string | null, locale: "tr" | "en") {
  return planType || (locale === "tr" ? "İşlem belirtilmedi" : "Operation not set");
}

export function planDetailLines(plan: Plan, locale: "tr" | "en", field?: Field | null) {
  const lines = [
    `${locale === "tr" ? "Tarih" : "Date"}: ${formatDate(plan.planned_date)}`,
    `${locale === "tr" ? "Durum" : "Status"}: ${planStatusLabel(plan.status, locale)}`,
    `${locale === "tr" ? "İşlem" : "Operation"}: ${planTypeLabel(plan.plan_type, locale)}`,
  ];

  if (plan.plan_type === "Ekim" && plan.planned_crop) {
    const currentCrop = field?.current_crop ? `${getCropSymbol(field.current_crop)} ${field.current_crop}` : locale === "tr" ? "Ekili ürün yok" : "No crop";
    lines.push(`${locale === "tr" ? "Ekim geçişi" : "Crop change"}: ${currentCrop} → ${getCropSymbol(plan.planned_crop)} ${plan.planned_crop}`);
  } else if (plan.planned_crop) {
    lines.push(`${locale === "tr" ? "Ürün" : "Crop"}: ${getCropSymbol(plan.planned_crop)} ${plan.planned_crop}`);
  }

  if (plan.notes) {
    lines.push(`${locale === "tr" ? "Not" : "Note"}: ${plan.notes}`);
  }

  return lines;
}
