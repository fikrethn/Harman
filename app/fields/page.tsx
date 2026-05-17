"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Filter, Layers, ListChecks, MapPinned, Plus, Ruler, Trash2, Wheat, X } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { FieldCard } from "@/components/FieldCard";
import { FormInput, FormSelect, FormTextarea } from "@/components/FormInput";
import { OperationHistory } from "@/components/OperationHistory";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import { areaToDekar } from "@/lib/utils";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field, FieldOperation, Plan } from "@/types/database";
import { crops, measurementUnits, operationTypes } from "@/types/field";

type Filters = {
  search: string;
  city: string;
  district: string;
  crop: string;
  planted: "all" | "planted" | "unplanted";
  minDekar: string;
  maxDekar: string;
  coordinates: "all" | "with" | "without";
  fertilizer: "all" | "done" | "planned" | "missing";
};

const defaultFilters: Filters = {
  search: "",
  city: "",
  district: "",
  crop: "",
  planted: "all",
  minDekar: "",
  maxDekar: "",
  coordinates: "all",
  fertilizer: "all",
};

export default function FieldsPage() {
  return (
    <AuthGuard>
      {(user) => <Fields userId={user.id} />}
    </AuthGuard>
  );
}

function Fields({ userId }: { userId: string }) {
  const { locale, t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [operations, setOperations] = useState<FieldOperation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [operationPanelOpen, setOperationPanelOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [operationSaving, setOperationSaving] = useState(false);
  const [operationType, setOperationType] = useState("Gübreleme");
  const [operationMessage, setOperationMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = requireSupabase();
    const [fieldsResult, operationsResult, plansResult] = await Promise.all([
      supabase.from("fields").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase
        .from("field_operations")
        .select("*")
        .eq("user_id", userId)
        .order("operation_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("plans").select("*").eq("user_id", userId).eq("status", "pending"),
    ]);

    if (fieldsResult.error) setError(fieldsResult.error.message);
    if (operationsResult.error) setError(operationsResult.error.message);
    if (plansResult.error) setError(plansResult.error.message);

    setFields((fieldsResult.data ?? []) as Field[]);
    setOperations((operationsResult.data ?? []) as FieldOperation[]);
    setPlans((plansResult.data ?? []) as Plan[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const fertilizerDoneIds = useMemo(
    () => new Set(operations.filter((operation) => operation.operation_type === "Gübreleme").map((operation) => operation.field_id)),
    [operations],
  );

  const fertilizerPlannedIds = useMemo(
    () => new Set(plans.filter((plan) => plan.plan_type === "Gübreleme").map((plan) => plan.field_id).filter(Boolean) as string[]),
    [plans],
  );

  const cityOptions = useMemo(() => unique(fields.map((field) => field.city)), [fields]);
  const districtOptions = useMemo(
    () => unique(fields.filter((field) => !filters.city || field.city === filters.city).map((field) => field.district)),
    [fields, filters.city],
  );

  const filteredFields = useMemo(() => {
    const search = normalize(filters.search);
    const minDekar = Number(filters.minDekar);
    const maxDekar = Number(filters.maxDekar);

    return fields.filter((field) => {
      const haystack = normalize(
        [field.name, field.city, field.district, field.neighborhood, field.block_no, field.parcel_no, field.current_crop].filter(Boolean).join(" "),
      );
      const area = areaToDekar(field);
      const isPlanted = Boolean(field.current_crop);
      const hasCoordinates = field.latitude !== null && field.longitude !== null;
      const hasFertilizer = fertilizerDoneIds.has(field.id);
      const hasFertilizerPlan = fertilizerPlannedIds.has(field.id);

      if (search && !haystack.includes(search)) return false;
      if (filters.city && field.city !== filters.city) return false;
      if (filters.district && field.district !== filters.district) return false;
      if (filters.crop && field.current_crop !== filters.crop) return false;
      if (filters.planted === "planted" && !isPlanted) return false;
      if (filters.planted === "unplanted" && isPlanted) return false;
      if (filters.minDekar && !Number.isNaN(minDekar) && area < minDekar) return false;
      if (filters.maxDekar && !Number.isNaN(maxDekar) && area > maxDekar) return false;
      if (filters.coordinates === "with" && !hasCoordinates) return false;
      if (filters.coordinates === "without" && hasCoordinates) return false;
      if (filters.fertilizer === "done" && !hasFertilizer) return false;
      if (filters.fertilizer === "planned" && !hasFertilizerPlan) return false;
      if (filters.fertilizer === "missing" && (hasFertilizer || hasFertilizerPlan)) return false;

      return true;
    });
  }, [fields, fertilizerDoneIds, fertilizerPlannedIds, filters]);

  const allSelected = filteredFields.length > 0 && filteredFields.every((field) => selectedIds.includes(field.id));
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value && value !== defaultFilters[key as keyof Filters]).length;
  const totalFilteredDekar = filteredFields.reduce((sum, field) => sum + areaToDekar(field), 0);
  const plantedFiltered = filteredFields.filter((field) => field.current_crop).length;
  const mappedFiltered = filteredFields.filter((field) => field.latitude !== null && field.longitude !== null).length;
  const selectedFields = fields.filter((field) => selectedIds.includes(field.id));

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "city" ? { district: "" } : {}),
    }));
  }

  function toggleField(id: string, checked: boolean) {
    setSelectedIds((current) => (checked ? [...new Set([...current, id])] : current.filter((selectedId) => selectedId !== id)));
  }

  function toggleAll(checked: boolean) {
    const filteredIds = filteredFields.map((field) => field.id);
    setSelectedIds((current) =>
      checked ? [...new Set([...current, ...filteredIds])] : current.filter((selectedId) => !filteredIds.includes(selectedId)),
    );
  }

  async function deleteSelected() {
    if (!selectedIds.length) return;

    const confirmed = window.confirm(
      locale === "tr"
        ? `${selectedIds.length} tarla silinecek. Bu tarlalara bağlı işlem ve plan kayıtları da silinir. Devam edilsin mi?`
        : `${selectedIds.length} fields will be deleted. Related operations and plans will also be deleted. Continue?`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");
    const { error } = await requireSupabase().from("fields").delete().eq("user_id", userId).in("id", selectedIds);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    setSelectedIds([]);
    await load();
    setDeleting(false);
  }

  async function applyBulkOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!selectedIds.length) return;

    setOperationSaving(true);
    setOperationMessage("");
    setError("");

    const form = new FormData(formElement);
    const selectedCrop = operationType === "Ekim" ? String(form.get("operation_crop") || "") : "";

    if (operationType === "Ekim" && !selectedCrop) {
      setOperationMessage(locale === "tr" ? "Ekim işlemi için ürün seçmelisiniz." : "Select a crop for planting.");
      setOperationSaving(false);
      return;
    }

    try {
    const supabase = requireSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError(userError?.message || (locale === "tr" ? "Oturum bulunamadı." : "No active session."));
      setOperationSaving(false);
      return;
    }

    const operationDate = String(form.get("operation_date") || new Date().toISOString().slice(0, 10));
    const payload = selectedIds.map((fieldId) => ({
      user_id: userData.user.id,
      field_id: fieldId,
      operation_type: operationType,
      operation_date: operationDate,
      material_name: operationType === "Ekim" ? selectedCrop : String(form.get("material_name") || "") || null,
      amount: Number(form.get("amount")) || null,
      unit: String(form.get("unit") || "") || null,
      cost: Number(form.get("cost")) || null,
      notes: String(form.get("notes") || "") || null,
    }));

    const { error: insertError } = await supabase.from("field_operations").insert(payload);
    if (insertError) {
      setError(insertError.message);
      setOperationSaving(false);
      return;
    }

    if (operationType === "Ekim") {
      const { error: updateError } = await supabase
        .from("fields")
        .update({ current_crop: selectedCrop, planting_date: operationDate })
        .eq("user_id", userId)
        .in("id", selectedIds);

      if (updateError) {
        setError(updateError.message);
        setOperationSaving(false);
        return;
      }
    }

    setOperationMessage(locale === "tr" ? `${selectedIds.length} tarla için işlem kaydedildi.` : `Operation saved for ${selectedIds.length} fields.`);
    setSelectedIds([]);
    formElement.reset();
    setOperationType("Gübreleme");
    await load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : locale === "tr" ? "İşlem kaydedilemedi." : "Operation could not be saved.");
    }
    setOperationSaving(false);
  }

  return (
    <main className="w-full pb-20 pt-3 md:pb-7">
      <div className="px-3 lg:px-5">
        <PageHeader
          title={t("fields")}
          description={locale === "tr" ? "Ada, parsel, ekili ürün, konum ve alan bilgileri." : "Block, parcel, crop, location and area details."}
          action={
            <>
          <Button variant="secondary" onClick={() => setFilterOpen((open) => !open)}>
            <Filter size={18} />
            {locale === "tr" ? "Filtreler" : "Filters"}
            {activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setOperationPanelOpen((open) => !open)}
            title={locale === "tr" ? "Seçili tarlalara işlem ekle" : "Add operation to selected fields"}
            aria-label={locale === "tr" ? "Seçili tarlalara işlem ekle" : "Add operation to selected fields"}
            className={operationPanelOpen ? "border-emerald-700 bg-emerald-100 dark:bg-emerald-950" : ""}
          >
            <Activity size={18} />
            {locale === "tr" ? "İşlem ekle" : "Add operation"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setLogsOpen((open) => !open)}
            title={locale === "tr" ? "Son işlem kayıtları" : "Recent operation logs"}
            aria-label={locale === "tr" ? "Son işlem kayıtları" : "Recent operation logs"}
            className={logsOpen ? "border-emerald-700 bg-emerald-100 dark:bg-emerald-950" : ""}
          >
            <ListChecks size={18} />
          </Button>
          {filteredFields.length ? (
            <Button variant="secondary" onClick={() => toggleAll(!allSelected)}>
              {allSelected ? (locale === "tr" ? "Seçimi kaldır" : "Clear") : locale === "tr" ? "Görünenleri seç" : "Select visible"}
            </Button>
          ) : null}
          {selectedIds.length ? (
            <Button variant="danger" onClick={deleteSelected} disabled={deleting}>
              <Trash2 size={18} />
              {deleting ? t("saving") : locale === "tr" ? `Seçilenleri sil (${selectedIds.length})` : `Delete selected (${selectedIds.length})`}
            </Button>
          ) : null}
          <Button href="/fields/new">
            <Plus size={18} /> {t("add")}
          </Button>
            </>
          }
        />
      </div>

      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
      {loading ? <p className="mt-5 text-stone-600 dark:text-stone-300">{t("loading")}</p> : null}

      {!loading && !fields.length ? (
        <div className="mx-4 mt-5 rounded-md border border-dashed border-stone-300 bg-white p-3 text-center dark:border-stone-700 dark:bg-stone-900 lg:mx-6">
          <h2 className="font-bold">{t("noFields")}</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("noFieldsText")}</p>
          <Button href="/fields/new" className="mt-4">
            {t("addField")}
          </Button>
        </div>
      ) : null}

      {!loading && fields.length ? (
        <>
        <section className="mt-3 grid grid-cols-4 gap-1.5 px-3 lg:px-5">
          <FieldMiniStat icon={<Layers size={15} />} label={locale === "tr" ? "Görünen tarla" : "Visible fields"} value={`${filteredFields.length} / ${fields.length}`} />
          <FieldMiniStat icon={<Ruler size={15} />} label={locale === "tr" ? "Görünen alan" : "Visible area"} value={`${totalFilteredDekar.toFixed(1)} dekar`} />
          <FieldMiniStat icon={<Wheat size={15} />} label={locale === "tr" ? "Ekili" : "Planted"} value={plantedFiltered} />
          <FieldMiniStat icon={<MapPinned size={15} />} label={locale === "tr" ? "Haritalı" : "Mapped"} value={mappedFiltered} />
        </section>

        {operationPanelOpen ? (
          <section className="mx-3 mt-3 rounded-xl border border-emerald-800/30 bg-white p-3 shadow-sm dark:border-emerald-500/30 dark:bg-stone-900 lg:mx-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h2 className="flex items-center gap-2 text-base font-black">
                  <Activity size={17} className="text-emerald-800 dark:text-emerald-300" />
                  {locale === "tr" ? "Seçili tarlalara işlem uygula" : "Apply operation to selected fields"}
                </h2>
                <p className="mt-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                  {selectedFields.length
                    ? `${selectedFields.slice(0, 5).map((field) => field.name).join(", ")}${selectedFields.length > 5 ? ` +${selectedFields.length - 5}` : ""}`
                    : locale === "tr"
                      ? "Listeden işlem yapılacak tarlaları seçin."
                      : "Select fields from the list first."}
                </p>
              </div>
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                {selectedIds.length} {locale === "tr" ? "tarla" : "fields"}
              </span>
            </div>

            <form onSubmit={applyBulkOperation} className="mt-3 grid gap-2 lg:grid-cols-[160px_150px_1fr]">
              <FormSelect label={locale === "tr" ? "İşlem" : "Operation"} value={operationType} onChange={(event) => setOperationType(event.target.value)}>
                {operationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FormSelect>
              <FormInput name="operation_date" label={locale === "tr" ? "Tarih" : "Date"} type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {operationType === "Ekim" ? (
                  <FormSelect name="operation_crop" label={locale === "tr" ? "Ekilen ürün" : "Crop"} required>
                    <option value="">{locale === "tr" ? "Ürün seç" : "Select crop"}</option>
                    {crops.map((crop) => (
                      <option key={crop.value} value={crop.value}>
                        {crop.symbol} {crop.label}
                      </option>
                    ))}
                  </FormSelect>
                ) : (
                  <FormInput name="material_name" label={locale === "tr" ? "Malzeme" : "Material"} />
                )}
                <FormInput name="amount" label={locale === "tr" ? "Miktar" : "Amount"} type="number" step="0.01" />
                <FormSelect name="unit" label={locale === "tr" ? "Birim" : "Unit"} defaultValue="">
                  <option value="">{locale === "tr" ? "Birim seç" : "Select unit"}</option>
                  {measurementUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </FormSelect>
                <FormInput name="cost" label={locale === "tr" ? "Maliyet" : "Cost"} type="number" step="0.01" />
              </div>
              <div className="lg:col-span-3">
                <FormTextarea name="notes" label={locale === "tr" ? "Not" : "Notes"} />
              </div>
              {operationMessage ? <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 lg:col-span-3">{operationMessage}</p> : null}
              <div className="flex gap-2 lg:col-span-3">
                <Button type="submit" disabled={operationSaving || !selectedIds.length}>
                  {operationSaving ? t("saving") : locale === "tr" ? "İşlemi kaydet" : "Save operation"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedIds([])}>
                  {locale === "tr" ? "Seçimi temizle" : "Clear selection"}
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {logsOpen ? (
          <section className="mx-3 mt-3 rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900 lg:mx-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-black">
                <ListChecks size={17} className="text-emerald-800 dark:text-emerald-300" />
                {locale === "tr" ? "Son işlem kayıtları" : "Recent operation logs"}
              </h2>
              <button
                type="button"
                onClick={() => setLogsOpen(false)}
                className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                aria-label={locale === "tr" ? "İşlem kayıtlarını kapat" : "Close operation logs"}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3">
              <OperationHistory operations={operations} fields={fields} maxItems={12} maxHeightClass="max-h-[320px]" onDeleted={load} />
            </div>
          </section>
        ) : null}

        <section className={`mt-3 grid gap-3 px-3 lg:px-5 ${filterOpen ? "lg:grid-cols-[280px_minmax(0,1fr)]" : ""}`}>
          {filterOpen ? (
            <aside className="h-fit rounded-xl border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900 lg:sticky lg:top-16 lg:min-h-[calc(100vh-4rem)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold">{locale === "tr" ? "Detaylı filtre" : "Detailed filter"}</h2>
                <button
                  type="button"
                  className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                  onClick={() => setFilterOpen(false)}
                  aria-label={locale === "tr" ? "Filtreyi kapat" : "Close filter"}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 grid gap-2.5">
                <FormInput label={locale === "tr" ? "Arama" : "Search"} value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
                <FormSelect label={locale === "tr" ? "İl" : "City"} value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
                  <option value="">{locale === "tr" ? "Tümü" : "All"}</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label={locale === "tr" ? "İlçe" : "District"}
                  value={filters.district}
                  onChange={(event) => updateFilter("district", event.target.value)}
                >
                  <option value="">{locale === "tr" ? "Tümü" : "All"}</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label={locale === "tr" ? "Ürün" : "Crop"} value={filters.crop} onChange={(event) => updateFilter("crop", event.target.value)}>
                  <option value="">{locale === "tr" ? "Tümü" : "All"}</option>
                  {crops.map((crop) => (
                    <option key={crop.value} value={crop.value}>
                      {crop.symbol} {crop.label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label={locale === "tr" ? "Ekili durum" : "Planting status"}
                  value={filters.planted}
                  onChange={(event) => updateFilter("planted", event.target.value as Filters["planted"])}
                >
                  <option value="all">{locale === "tr" ? "Tümü" : "All"}</option>
                  <option value="planted">{locale === "tr" ? "Ekili" : "Planted"}</option>
                  <option value="unplanted">{locale === "tr" ? "Ekili değil" : "Unplanted"}</option>
                </FormSelect>
                <div className="grid grid-cols-2 gap-2">
                  <FormInput
                    label={locale === "tr" ? "Min dekar" : "Min decare"}
                    type="number"
                    min="0"
                    value={filters.minDekar}
                    onChange={(event) => updateFilter("minDekar", event.target.value)}
                  />
                  <FormInput
                    label={locale === "tr" ? "Max dekar" : "Max decare"}
                    type="number"
                    min="0"
                    value={filters.maxDekar}
                    onChange={(event) => updateFilter("maxDekar", event.target.value)}
                  />
                </div>
                <FormSelect
                  label={locale === "tr" ? "Harita konumu" : "Map location"}
                  value={filters.coordinates}
                  onChange={(event) => updateFilter("coordinates", event.target.value as Filters["coordinates"])}
                >
                  <option value="all">{locale === "tr" ? "Tümü" : "All"}</option>
                  <option value="with">{locale === "tr" ? "Koordinatı olan" : "Has coordinates"}</option>
                  <option value="without">{locale === "tr" ? "Koordinatı olmayan" : "No coordinates"}</option>
                </FormSelect>
                <FormSelect
                  label={locale === "tr" ? "Gübre durumu" : "Fertilizer status"}
                  value={filters.fertilizer}
                  onChange={(event) => updateFilter("fertilizer", event.target.value as Filters["fertilizer"])}
                >
                  <option value="all">{locale === "tr" ? "Tümü" : "All"}</option>
                  <option value="done">{locale === "tr" ? "Gübre kaydı var" : "Has fertilizer record"}</option>
                  <option value="planned">{locale === "tr" ? "Gübre planı var" : "Has fertilizer plan"}</option>
                  <option value="missing">{locale === "tr" ? "Gübre kaydı/planı yok" : "No fertilizer record/plan"}</option>
                </FormSelect>
                <Button type="button" variant="ghost" onClick={() => setFilters(defaultFilters)}>
                  {locale === "tr" ? "Filtreleri temizle" : "Clear filters"}
                </Button>
              </div>
            </aside>
          ) : null}

          <div className="min-w-0">
            <div className="mb-3 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              {locale === "tr"
                ? `${filteredFields.length} / ${fields.length} tarla gösteriliyor`
                : `Showing ${filteredFields.length} / ${fields.length} fields`}
            </div>
            {filteredFields.length ? (
              <div className="overflow-hidden rounded-md border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-950">
                <div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.8fr)_120px_145px_96px] gap-2 border-b border-stone-200 bg-stone-100 px-4 py-2 text-[11px] font-black uppercase text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 md:grid">
                  <span>{locale === "tr" ? "Tarla" : "Field"}</span>
                  <span>{locale === "tr" ? "Ürün" : "Crop"}</span>
                  <span>{locale === "tr" ? "Alan" : "Area"}</span>
                  <span>Ada / Parsel</span>
                  <span></span>
                </div>
                {filteredFields.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    selected={selectedIds.includes(field.id)}
                    onSelectedChange={(checked) => toggleField(field.id, checked)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-300 bg-white p-3 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                {locale === "tr" ? "Bu filtrelere uyan tarla bulunamadı." : "No fields match these filters."}
              </div>
            )}
          </div>
        </section>

        </>
      ) : null}
    </main>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "tr"));
}

function FieldMiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="min-w-0 rounded-lg border border-stone-300 bg-white px-2 py-1.5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex min-w-0 items-center justify-between gap-1">
        <p className="truncate text-[9px] font-black uppercase text-stone-500 dark:text-stone-400 sm:text-[10px]">{label}</p>
        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 sm:size-6">{icon}</span>
      </div>
      <p className="mt-1 truncate text-xs font-black sm:text-sm">{value}</p>
    </article>
  );
}
