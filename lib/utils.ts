import type { AreaUnit, Field } from "@/types/database";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export function formatArea(area?: number | null, unit?: AreaUnit | null) {
  if (!area) return "-";
  const label = unit === "m2" ? "m2" : unit ?? "";
  return `${new Intl.NumberFormat("tr-TR").format(area)} ${label}`;
}

export function areaToDekar(field: Field) {
  if (!field.area) return 0;
  if (field.area_unit === "hektar") return field.area * 10;
  if (field.area_unit === "m2") return field.area / 1000;
  return field.area;
}

export function locationText(field: Pick<Field, "city" | "district" | "neighborhood">) {
  return [field.neighborhood, field.district, field.city].filter(Boolean).join(" / ");
}
