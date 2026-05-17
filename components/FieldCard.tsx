"use client";

import { ChevronRight, MapPin, Ruler, Sprout } from "lucide-react";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { formatArea, locationText } from "@/lib/utils";
import type { Field } from "@/types/database";
import { getCropSymbol } from "@/types/field";

export function FieldCard({
  field,
  selected = false,
  onSelectedChange,
}: {
  field: Field;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <article className="grid gap-2 border-b border-stone-200 bg-white px-2.5 py-2.5 transition hover:bg-emerald-50/50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900 md:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.8fr)_120px_145px_96px] md:items-center md:px-4 md:py-3">
      <div className="flex min-w-0 items-start gap-2 md:gap-3">
        {onSelectedChange ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange(event.target.checked)}
            aria-label={locale === "tr" ? `${field.name} tarlasını seç` : `Select ${field.name}`}
            className="mt-1 size-3.5 shrink-0 rounded border-stone-400 accent-emerald-700 md:size-4"
          />
        ) : null}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-7 w-1 rounded-full bg-gradient-to-b from-emerald-600 to-lime-400 md:h-8" />
            <h3 className="truncate text-sm font-black text-stone-950 dark:text-stone-50 md:text-base">{field.name}</h3>
          </div>
          <p className="mt-0.5 flex min-w-0 items-start gap-1 text-xs text-stone-600 dark:text-stone-400">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{locationText(field)}</span>
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">{t("currentCrop")}</p>
        <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <span>{getCropSymbol(field.current_crop)}</span>
          {field.current_crop || (locale === "tr" ? "Ürün yok" : "No crop")}
        </p>
      </div>

      <div className="hidden md:block">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
          <Ruler size={13} /> {t("area")}
        </p>
        <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">{formatArea(field.area, field.area_unit)}</p>
      </div>

      <div className="hidden md:block">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
          <Sprout size={13} /> Ada / Parsel
        </p>
        <p className="mt-1 text-sm font-bold text-stone-950 dark:text-stone-50">{[field.block_no, field.parcel_no].filter(Boolean).join(" / ") || "-"}</p>
      </div>

      <Button href={`/fields/${field.id}`} variant="secondary" className="w-full md:min-h-8">
        {locale === "tr" ? "Detay" : "Details"}
        <ChevronRight size={14} />
      </Button>
    </article>
  );
}
