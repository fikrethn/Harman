"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CheckSquare, Clock3, Layers, Square, XCircle } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/FormInput";
import { PageHeader } from "@/components/PageHeader";
import { PlanCard } from "@/components/PlanCard";
import { useI18n } from "@/lib/i18n";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field, Plan } from "@/types/database";
import { crops, getCropSymbol, operationTypes } from "@/types/field";

export default function PlansPage() {
  return (
    <AuthGuard>
      {(user) => <Plans userId={user.id} />}
    </AuthGuard>
  );
}

function PlanMiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <article className="rounded-lg border border-stone-300 bg-white p-2 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-6 place-items-center rounded-md text-white ${tone}`}>{icon}</span>
        <span className="text-base font-black">{value}</span>
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">{label}</p>
    </article>
  );
}

function Plans({ userId }: { userId: string }) {
  const { locale, t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [planType, setPlanType] = useState("Ekim");
  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldPlantingFilter, setFieldPlantingFilter] = useState<"all" | "planted" | "unplanted">("all");
  const [fieldCropFilter, setFieldCropFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fieldNames = useMemo(() => Object.fromEntries(fields.map((field) => [field.id, field.name])), [fields]);
  const filteredFields = useMemo(() => {
    const search = fieldSearch.toLocaleLowerCase("tr-TR").trim();

    return fields.filter((field) => {
      const haystack = [field.name, field.city, field.district, field.neighborhood, field.current_crop]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      const planted = Boolean(field.current_crop);

      if (search && !haystack.includes(search)) return false;
      if (fieldPlantingFilter === "planted" && !planted) return false;
      if (fieldPlantingFilter === "unplanted" && planted) return false;
      if (fieldCropFilter && field.current_crop !== fieldCropFilter) return false;

      return true;
    });
  }, [fieldCropFilter, fieldPlantingFilter, fieldSearch, fields]);
  const allFieldsSelected = filteredFields.length > 0 && filteredFields.every((field) => selectedFieldIds.includes(field.id));
  const pendingCount = plans.filter((plan) => plan.status === "pending").length;
  const completedCount = plans.filter((plan) => plan.status === "completed").length;
  const cancelledCount = plans.filter((plan) => plan.status === "cancelled").length;

  const load = useCallback(async () => {
    setError("");
    const supabase = requireSupabase();
    const [plansResult, fieldsResult] = await Promise.all([
      supabase.from("plans").select("*").eq("user_id", userId).order("planned_date", { ascending: true }),
      supabase.from("fields").select("*").eq("user_id", userId).order("name", { ascending: true }),
    ]);

    if (plansResult.error) setError(plansResult.error.message);
    if (fieldsResult.error) setError(fieldsResult.error.message);

    setPlans((plansResult.data ?? []) as Plan[]);
    setFields((fieldsResult.data ?? []) as Field[]);
    setSelectedFieldIds((current) => current.filter((id) => (fieldsResult.data ?? []).some((field) => field.id === id)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleField(id: string, checked: boolean) {
    setSelectedFieldIds((current) => (checked ? [...new Set([...current, id])] : current.filter((fieldId) => fieldId !== id)));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const plannedDate = String(form.get("planned_date") || "") || null;
    const notes = String(form.get("notes") || "").trim() || null;
    const plannedCrop = planType === "Ekim" ? String(form.get("planned_crop") || "").trim() : "";

    setError("");

    if (!selectedFieldIds.length) {
      setError(locale === "tr" ? "En az bir tarla seçmelisiniz." : "Select at least one field.");
      return;
    }

    if (planType === "Ekim" && !plannedCrop) {
      setError(locale === "tr" ? "Ekim planı için ekilecek ürünü seçmelisiniz." : "Select a crop for sowing plans.");
      return;
    }

    setSaving(true);
    const supabase = requireSupabase();
    const selectedOwnedFields = fields.filter((field) => selectedFieldIds.includes(field.id) && field.user_id === userId);

    if (selectedOwnedFields.length !== selectedFieldIds.length) {
      setError(locale === "tr" ? "Seçilen tarlalar oturumunuzla uyuşmuyor. Sayfayı yenileyip tekrar deneyin." : "Selected fields do not match your session. Refresh and try again.");
      setSaving(false);
      return;
    }

    const payload = selectedOwnedFields.map((field) => ({
      user_id: userId,
      field_id: field.id,
      title,
      plan_type: planType,
      planned_crop: planType === "Ekim" ? plannedCrop : null,
      planned_date: plannedDate,
      notes,
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("plans").insert(payload);

    if (insertError) {
      setError(
        insertError.code === "42501"
          ? locale === "tr"
            ? "Plan kaydı RLS kuralına takıldı. Supabase SQL Editor'da supabase/fix_plans_rls.sql dosyasındaki onarım sorgusunu bir kez çalıştırın."
            : "Plan insert hit an RLS policy. Run supabase/fix_plans_rls.sql once in Supabase SQL Editor."
          : insertError.message,
      );
      setSaving(false);
      return;
    }

    formElement.reset();
    setPlanType("Ekim");
    setSelectedFieldIds([]);
    await load();
    setSaving(false);
  }

  async function updateStatus(plan: Plan, status: string) {
    const supabase = requireSupabase();
    const operationDate = new Date().toISOString().slice(0, 10);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError(userError?.message || (locale === "tr" ? "Oturum bulunamadı." : "No active session."));
      return;
    }

    if (status === "completed" && plan.field_id && plan.plan_type) {
      const { error: operationError } = await supabase.from("field_operations").insert({
        user_id: userData.user.id,
        field_id: plan.field_id,
        operation_type: plan.plan_type,
        operation_date: operationDate,
        material_name: plan.plan_type === "Ekim" ? plan.planned_crop : null,
        notes: plan.notes ? `Plandan tamamlandı: ${plan.title}. ${plan.notes}` : `Plandan tamamlandı: ${plan.title}`,
      });

      if (operationError) {
        setError(operationError.message);
        return;
      }

      if (plan.plan_type === "Ekim" && plan.planned_crop) {
        const { error: fieldError } = await supabase
          .from("fields")
          .update({ current_crop: plan.planned_crop, planting_date: operationDate })
          .eq("user_id", userId)
          .eq("id", plan.field_id);

        if (fieldError) {
          setError(fieldError.message);
          return;
        }
      }
    }

    const { error: updateError } = await supabase.from("plans").update({ status }).eq("id", plan.id).eq("user_id", userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  }

  return (
    <main className="mx-auto max-w-6xl px-3 pb-20 pt-3 md:pb-8">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <PageHeader
          title={t("plans")}
          description={locale === "tr" ? "Yapılacak işleri tarih, tarla ve ürün bazında planlayın." : "Plan upcoming work by date, field and crop."}
        />
        <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
          <PlanMiniStat icon={<Clock3 size={14} />} label={locale === "tr" ? "Bekleyen" : "Pending"} value={pendingCount} tone="bg-amber-500" />
          <PlanMiniStat icon={<CheckCircle2 size={14} />} label={locale === "tr" ? "Tamam" : "Done"} value={completedCount} tone="bg-emerald-600" />
          <PlanMiniStat icon={<XCircle size={14} />} label={locale === "tr" ? "İptal" : "Cancel"} value={cancelledCount} tone="bg-red-500" />
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}

      <section className="mt-5 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="rounded-lg bg-gradient-to-r from-emerald-900 to-teal-700 p-3 text-white">
            <div className="flex items-center gap-2">
              <CalendarClock size={17} />
              <h2 className="text-base font-black">{locale === "tr" ? "Yeni plan" : "New plan"}</h2>
            </div>
            <p className="mt-1 text-sm text-emerald-50">
              {locale === "tr"
                ? "Bir planı aynı anda birden fazla tarlaya ekleyebilirsiniz."
                : "You can add one plan to multiple fields at once."}
            </p>
          </div>

          <FormInput name="title" label={t("title")} required placeholder={locale === "tr" ? "Örn. Üst gübre uygulaması" : "Example: Top dressing"} />

          <FormSelect name="plan_type" label={t("operationType")} value={planType} onChange={(event) => setPlanType(event.target.value)}>
            {operationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </FormSelect>

          {planType === "Ekim" ? (
            <FormSelect name="planned_crop" label={locale === "tr" ? "Ekilecek ürün" : "Crop to plant"} required>
              <option value="">{locale === "tr" ? "Ürün seç" : "Select crop"}</option>
              {crops.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {crop.symbol} {crop.label}
                </option>
              ))}
            </FormSelect>
          ) : null}

          <FormInput name="planned_date" label={t("date")} type="date" />
          <FormTextarea name="notes" label={t("notes")} />

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-950">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-bold">
                <Layers size={15} className="text-emerald-800 dark:text-emerald-300" />
                {locale === "tr" ? "Tarlalar" : "Fields"}
              </p>
              <button
                type="button"
                className="text-sm font-bold text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
                onClick={() => {
                  const filteredIds = filteredFields.map((field) => field.id);
                  setSelectedFieldIds((current) =>
                    allFieldsSelected
                      ? current.filter((id) => !filteredIds.includes(id))
                      : [...new Set([...current, ...filteredIds])],
                  );
                }}
              >
                {allFieldsSelected ? (locale === "tr" ? "Görünen seçimi kaldır" : "Clear visible") : locale === "tr" ? "Görünenleri seç" : "Select visible"}
              </button>
            </div>
            <div className="mt-3 grid gap-2 rounded-md border border-stone-200 bg-white/70 p-2 dark:border-stone-700 dark:bg-stone-900/70">
              <FormInput
                label={locale === "tr" ? "Tarla ara" : "Search fields"}
                value={fieldSearch}
                onChange={(event) => setFieldSearch(event.target.value)}
                placeholder={locale === "tr" ? "Ad, ilçe, ürün..." : "Name, district, crop..."}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <FormSelect
                  label={locale === "tr" ? "Ekili durum" : "Planting status"}
                  value={fieldPlantingFilter}
                  onChange={(event) => setFieldPlantingFilter(event.target.value as "all" | "planted" | "unplanted")}
                >
                  <option value="all">{locale === "tr" ? "Tümü" : "All"}</option>
                  <option value="planted">{locale === "tr" ? "Ekili olanlar" : "Planted"}</option>
                  <option value="unplanted">{locale === "tr" ? "Ekili olmayanlar" : "Unplanted"}</option>
                </FormSelect>
                <FormSelect
                  label={locale === "tr" ? "Ürün" : "Crop"}
                  value={fieldCropFilter}
                  onChange={(event) => setFieldCropFilter(event.target.value)}
                >
                  <option value="">{locale === "tr" ? "Tüm ürünler" : "All crops"}</option>
                  {crops.map((crop) => (
                    <option key={crop.value} value={crop.value}>
                      {crop.symbol} {crop.label}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {locale === "tr"
                  ? `${filteredFields.length} / ${fields.length} tarla listeleniyor`
                  : `${filteredFields.length} / ${fields.length} fields shown`}
              </p>
            </div>
            <div className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1">
              {filteredFields.length ? (
                filteredFields.map((field) => {
                  const checked = selectedFieldIds.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm transition hover:border-emerald-600 dark:border-stone-700 dark:bg-stone-900"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(event) => toggleField(field.id, event.target.checked)}
                      />
                      <span className="mt-0.5 text-emerald-800 dark:text-emerald-300">{checked ? <CheckSquare size={18} /> : <Square size={18} />}</span>
                      <span>
                        <span className="block font-bold text-stone-950 dark:text-stone-50">{field.name}</span>
                        <span className="text-stone-600 dark:text-stone-400">
                          {field.city} / {field.district}
                          {field.current_crop ? ` - ${getCropSymbol(field.current_crop)} ${field.current_crop}` : locale === "tr" ? " - ekili değil" : " - unplanted"}
                        </span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {fields.length
                    ? locale === "tr"
                      ? "Bu filtrelere uyan tarla yok."
                      : "No fields match these filters."
                    : locale === "tr"
                      ? "Önce tarla eklemelisiniz."
                      : "Add fields first."}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
              {locale === "tr" ? `${selectedFieldIds.length} tarla seçildi` : `${selectedFieldIds.length} fields selected`}
            </p>
          </div>

          <Button type="submit" disabled={saving || !fields.length}>
            {saving ? t("saving") : locale === "tr" ? "Plan ekle" : "Add plan"}
          </Button>
        </form>

        <div>
          {loading ? <p>{t("loading")}</p> : null}
          {!loading && !plans.length ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-3 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              {t("noPlans")}
            </div>
          ) : null}
          <div className="grid gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="grid gap-2">
                <PlanCard plan={plan} fieldName={plan.field_id ? fieldNames[plan.field_id] : undefined} />
                {plan.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => updateStatus(plan, "completed")}>
                      {locale === "tr" ? "Yapıldı" : "Done"}
                    </Button>
                    <Button variant="ghost" onClick={() => updateStatus(plan, "cancelled")}>
                      {t("cancelled")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
