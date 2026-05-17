"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/FormInput";
import { useI18n } from "@/lib/i18n";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field } from "@/types/database";
import { crops, getCropSymbol, measurementUnits, operationTypes } from "@/types/field";

type FieldFilter = {
  search: string;
  crop: string;
  planted: "all" | "planted" | "unplanted";
};

export default function NewOperationPage() {
  return (
    <AuthGuard>
      {(user) => <OperationForm userId={user.id} />}
    </AuthGuard>
  );
}

function OperationForm({ userId }: { userId: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [operationType, setOperationType] = useState("");
  const [filter, setFilter] = useState<FieldFilter>({ search: "", crop: "", planted: "all" });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await requireSupabase()
      .from("fields")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) setError(error.message);
    const loadedFields = (data ?? []) as Field[];
    setFields(loadedFields);
    setSelectedIds(loadedFields.some((field) => field.id === params.id) ? [params.id] : []);
    setPageLoading(false);
  }, [params.id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (operationType === "Hasat") {
      setFilter((current) => ({ ...current, planted: "planted" }));
      setSelectedIds((current) => current.filter((id) => fields.find((field) => field.id === id)?.current_crop));
    }
  }, [fields, operationType]);

  const filteredFields = useMemo(() => {
    const search = filter.search.toLocaleLowerCase("tr-TR").trim();

    return fields.filter((field) => {
      const planted = Boolean(field.current_crop);
      const haystack = [field.name, field.city, field.district, field.neighborhood, field.current_crop]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      if (operationType === "Hasat" && !planted) return false;
      if (search && !haystack.includes(search)) return false;
      if (filter.crop && field.current_crop !== filter.crop) return false;
      if (filter.planted === "planted" && !planted) return false;
      if (filter.planted === "unplanted" && planted) return false;

      return true;
    });
  }, [fields, filter, operationType]);

  const selectedFields = fields.filter((field) => selectedIds.includes(field.id));
  const allVisibleSelected = filteredFields.length > 0 && filteredFields.every((field) => selectedIds.includes(field.id));
  const harvestCrops = Array.from(new Set(selectedFields.map((field) => field.current_crop).filter(Boolean) as string[]));

  function toggleField(id: string, checked: boolean) {
    setSelectedIds((current) => (checked ? [...new Set([...current, id])] : current.filter((fieldId) => fieldId !== id)));
  }

  function toggleVisible() {
    const visibleIds = filteredFields.map((field) => field.id);
    setSelectedIds((current) =>
      allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!operationType) {
      setError(locale === "tr" ? "İşlem türü seçmelisiniz." : "Select an operation type.");
      setLoading(false);
      return;
    }

    if (!selectedIds.length) {
      setError(locale === "tr" ? "En az bir tarla seçmelisiniz." : "Select at least one field.");
      setLoading(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const operationDate = String(form.get("operation_date") || "");
    const plantingCrop = operationType === "Ekim" ? String(form.get("planting_crop") || "") : "";

    if (operationType === "Ekim" && !plantingCrop) {
      setError(locale === "tr" ? "Ekim işlemi için ürün seçmelisiniz." : "Select a crop for planting.");
      setLoading(false);
      return;
    }

    if (operationType === "Hasat" && selectedFields.some((field) => !field.current_crop)) {
      setError(locale === "tr" ? "Ekili olmayan tarlalar hasat edilemez." : "Unplanted fields cannot be harvested.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await requireSupabase().auth.getUser();
    if (userError || !userData.user) {
      setError(userError?.message || (locale === "tr" ? "Oturum bulunamadı." : "No active session."));
      setLoading(false);
      return;
    }

    const payload = selectedFields.map((field) => ({
      user_id: userData.user.id,
      field_id: field.id,
      operation_type: operationType,
      operation_date: operationDate,
      material_name:
        operationType === "Hasat"
          ? field.current_crop
          : operationType === "Ekim"
            ? plantingCrop
            : String(form.get("material_name") || "") || null,
      amount: Number(form.get(operationType === "Hasat" ? "yield_amount" : "amount")) || null,
      unit: String(form.get(operationType === "Hasat" ? "yield_unit" : "unit") || "") || null,
      cost: operationType === "Hasat" ? null : Number(form.get("cost")) || null,
      notes: String(form.get("notes") || "") || null,
    }));

    const supabase = requireSupabase();
    const { error: insertError } = await supabase.from("field_operations").insert(payload);
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (operationType === "Ekim") {
      const { error: updateError } = await supabase
        .from("fields")
        .update({ current_crop: plantingCrop, planting_date: operationDate })
        .eq("user_id", userId)
        .in("id", selectedIds);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    }

    if (operationType === "Hasat") {
      const { error: updateError } = await supabase
        .from("fields")
        .update({ current_crop: null, planting_date: null })
        .eq("user_id", userId)
        .in("id", selectedIds);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(selectedIds.length === 1 ? `/fields/${selectedIds[0]}` : "/fields");
  }

  if (pageLoading) return <main className="mx-auto max-w-6xl px-3 py-6">{t("loading")}</main>;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-20 pt-3 md:pb-8">
      <section className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <h1 className="text-xl font-black">{t("addOperation")}</h1>
        <p className="mt-2 text-sm font-medium text-stone-700 dark:text-stone-300">
          {locale === "tr"
            ? "Bir veya birden fazla tarlaya aynı işlem kaydını ekleyin. Tarlaları filtreleyerek seçebilirsiniz."
            : "Add the same operation to one or more fields. Filter fields before selecting."}
        </p>
      </section>

      <form onSubmit={submit} className="mt-5 grid gap-3 rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="grid gap-3 lg:grid-cols-[220px_180px_1fr]">
          <FormSelect label={t("operationType")} required value={operationType} onChange={(event) => setOperationType(event.target.value)}>
            <option value="">{locale === "tr" ? "İşlem türü seçin" : "Select operation type"}</option>
            {operationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </FormSelect>
          <FormInput name="operation_date" label={t("date")} type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />

          {operationType === "Hasat" ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              {locale === "tr" ? "Hasat edilecek ürün otomatik alınır" : "Harvested crop is filled automatically"}:{" "}
              {harvestCrops.length ? harvestCrops.map((crop) => `${getCropSymbol(crop)} ${crop}`).join(", ") : "-"}
            </div>
          ) : operationType === "Ekim" ? (
            <FormSelect name="planting_crop" label={locale === "tr" ? "Ekilecek ürün" : "Crop to plant"} required>
              <option value="">{locale === "tr" ? "Ürün seç" : "Select crop"}</option>
              {crops.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {crop.symbol} {crop.label}
                </option>
              ))}
            </FormSelect>
          ) : (
            <FormInput name="material_name" label={t("material")} />
          )}
        </div>

        <FieldPicker
          fields={filteredFields}
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          filter={filter}
          operationType={operationType}
          onFilterChange={setFilter}
          onToggleField={toggleField}
          onToggleVisible={toggleVisible}
        />

        {operationType === "Hasat" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput name="yield_amount" label={locale === "tr" ? "Verim" : "Yield"} type="number" step="0.01" />
            <FormSelect name="yield_unit" label={locale === "tr" ? "Verim birimi" : "Yield unit"} defaultValue="">
              <option value="">{locale === "tr" ? "Birim seç" : "Select unit"}</option>
              {measurementUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </FormSelect>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <FormInput name="amount" label={t("amount")} type="number" step="0.01" />
            <FormSelect name="unit" label={t("unit")} defaultValue="">
              <option value="">{locale === "tr" ? "Birim seç" : "Select unit"}</option>
              {measurementUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </FormSelect>
            <FormInput name="cost" label={t("cost")} type="number" step="0.01" />
          </div>
        )}

        <FormTextarea name="notes" label={t("notes")} />
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={loading}>
            {loading ? t("saving") : t("saveOperation")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push(`/fields/${params.id}`)}>
            {locale === "tr" ? "Vazgeç" : "Cancel"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function FieldPicker({
  fields,
  selectedIds,
  allVisibleSelected,
  filter,
  operationType,
  onFilterChange,
  onToggleField,
  onToggleVisible,
}: {
  fields: Field[];
  selectedIds: string[];
  allVisibleSelected: boolean;
  filter: FieldFilter;
  operationType: string;
  onFilterChange: (filter: FieldFilter) => void;
  onToggleField: (id: string, checked: boolean) => void;
  onToggleVisible: () => void;
}) {
  const { locale } = useI18n();

  return (
    <section className="rounded-lg border border-stone-300 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-950">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-black">{locale === "tr" ? "Tarlalar" : "Fields"}</h2>
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            {operationType === "Hasat"
              ? locale === "tr"
                ? "Hasat için sadece ekili tarlalar listelenir."
                : "Only planted fields are listed for harvest."
              : locale === "tr"
                ? "Filtreleyip birden fazla tarla seçebilirsiniz."
                : "Filter and select multiple fields."}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onToggleVisible}>
          {allVisibleSelected ? (locale === "tr" ? "Görünen seçimi kaldır" : "Clear visible") : locale === "tr" ? "Görünenleri seç" : "Select visible"}
        </Button>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <FormInput
          label={locale === "tr" ? "Tarla ara" : "Search fields"}
          value={filter.search}
          onChange={(event) => onFilterChange({ ...filter, search: event.target.value })}
          placeholder={locale === "tr" ? "Ad, ilçe, ürün..." : "Name, district, crop..."}
        />
        <FormSelect
          label={locale === "tr" ? "Ürün" : "Crop"}
          value={filter.crop}
          onChange={(event) => onFilterChange({ ...filter, crop: event.target.value })}
        >
          <option value="">{locale === "tr" ? "Tüm ürünler" : "All crops"}</option>
          {crops.map((crop) => (
            <option key={crop.value} value={crop.value}>
              {crop.symbol} {crop.label}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          label={locale === "tr" ? "Ekili durum" : "Planting status"}
          value={operationType === "Hasat" ? "planted" : filter.planted}
          disabled={operationType === "Hasat"}
          onChange={(event) => onFilterChange({ ...filter, planted: event.target.value as FieldFilter["planted"] })}
        >
          <option value="all">{locale === "tr" ? "Tümü" : "All"}</option>
          <option value="planted">{locale === "tr" ? "Ekili olanlar" : "Planted"}</option>
          <option value="unplanted">{locale === "tr" ? "Ekili olmayanlar" : "Unplanted"}</option>
        </FormSelect>
      </div>

      <div className="mt-3 grid max-h-72 gap-2 overflow-auto pr-1 md:grid-cols-2">
        {fields.map((field) => {
          const checked = selectedIds.includes(field.id);
          return (
            <label
              key={field.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm transition hover:border-emerald-600 dark:border-stone-700 dark:bg-stone-900"
            >
              <input type="checkbox" className="sr-only" checked={checked} onChange={(event) => onToggleField(field.id, event.target.checked)} />
              <span className="mt-0.5 text-emerald-800 dark:text-emerald-300">{checked ? <CheckSquare size={18} /> : <Square size={18} />}</span>
              <span>
                <span className="block font-bold text-stone-950 dark:text-stone-50">{field.name}</span>
                <span className="text-stone-600 dark:text-stone-400">
                  {field.city} / {field.district} -{" "}
                  {field.current_crop ? `${getCropSymbol(field.current_crop)} ${field.current_crop}` : locale === "tr" ? "ekili değil" : "unplanted"}
                </span>
              </span>
            </label>
          );
        })}
        {!fields.length ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-3 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
            {operationType === "Hasat"
              ? locale === "tr"
                ? "Hasat edilebilecek ekili tarla bulunamadı."
                : "No planted fields available for harvest."
              : locale === "tr"
                ? "Bu filtrelere uyan tarla yok."
                : "No fields match these filters."}
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
        {locale === "tr" ? `${selectedIds.length} tarla seçildi` : `${selectedIds.length} fields selected`}
      </p>
    </section>
  );
}
