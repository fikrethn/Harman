"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Edit3, ExternalLink, MapPin, Plus, Sprout, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { FieldEditForm } from "@/components/FieldEditForm";
import { OperationHistory } from "@/components/OperationHistory";
import { useI18n } from "@/lib/i18n";
import { formatArea, formatDate, locationText } from "@/lib/utils";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field, FieldOperation, Plan } from "@/types/database";
import { getCropSymbol } from "@/types/field";

export default function FieldDetailPage() {
  return (
    <AuthGuard>
      {(user) => <FieldDetail userId={user.id} />}
    </AuthGuard>
  );
}

function FieldDetail({ userId }: { userId: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [field, setField] = useState<Field | null>(null);
  const [operations, setOperations] = useState<FieldOperation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = requireSupabase();
    const [fieldResult, operationsResult, plansResult] = await Promise.all([
      supabase.from("fields").select("*").eq("user_id", userId).eq("id", params.id).single(),
      supabase
        .from("field_operations")
        .select("*")
        .eq("user_id", userId)
        .eq("field_id", params.id)
        .order("operation_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("plans")
        .select("*")
        .eq("user_id", userId)
        .eq("field_id", params.id)
        .order("planned_date", { ascending: true }),
    ]);

    setField(fieldResult.data as Field | null);
    setOperations((operationsResult.data ?? []) as FieldOperation[]);
    setPlans((plansResult.data ?? []) as Plan[]);
    setLoading(false);
  }, [params.id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteField() {
    if (!field) return;

    const confirmed = window.confirm(
      locale === "tr"
        ? `"${field.name}" tarlası silinecek. Bu tarlaya bağlı işlem ve plan kayıtları da silinir. Devam edilsin mi?`
        : `"${field.name}" will be deleted. Related operations and plans will also be deleted. Continue?`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");
    const { error } = await requireSupabase().from("fields").delete().eq("user_id", userId).eq("id", field.id);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    router.push("/fields");
  }

  if (loading) return <main className="mx-auto max-w-6xl px-3 py-6">{t("loading")}</main>;
  if (!field) return <main className="mx-auto max-w-6xl px-3 py-6">{t("fieldNotFound")}</main>;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-20 pt-3 md:pb-8">
      <section className="overflow-hidden rounded-xl border border-emerald-950/15 bg-white shadow-sm dark:border-stone-700">
        <div className="grid gap-3 bg-[radial-gradient(circle_at_12%_15%,rgba(52,211,153,0.24),transparent_24%),linear-gradient(135deg,rgba(255,247,232,0.98),rgba(241,228,205,0.94))] p-3 dark:bg-none lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">{locale === "tr" ? "Tarla detayı" : "Field detail"}</p>
            <h1 className="mt-1 break-words text-xl font-black">{field.name}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-300">
              <MapPin size={14} className="shrink-0 text-emerald-800 dark:text-emerald-300" />
              {locationText(field)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <Sprout size={13} /> {getCropSymbol(field.current_crop)} {field.current_crop || (locale === "tr" ? "Ekili değil" : "Unplanted")}
              </span>
              <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700 dark:bg-stone-900 dark:text-stone-200">
                {formatArea(field.area, field.area_unit)}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px] lg:grid-cols-2">
            <Button href={`/fields/${field.id}/operations/new`} className="w-full">
              <Plus size={15} /> {locale === "tr" ? "İşlem" : "Operation"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing((value) => !value)} className="w-full">
              <Edit3 size={15} /> {editing ? (locale === "tr" ? "Kapat" : "Close") : locale === "tr" ? "Düzenle" : "Edit"}
            </Button>
            <a
              href="https://parselsorgu.tkgm.gov.tr/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-md border border-stone-400 bg-[#fff7e8] px-2.5 py-1 text-xs font-semibold text-stone-950 transition hover:bg-[#ead8b6] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
            >
              <ExternalLink size={14} /> TKGM
            </a>
            <Button variant="danger" onClick={deleteField} disabled={deleting} className="w-full">
              <Trash2 size={15} />
              {deleting ? t("saving") : locale === "tr" ? "Sil" : "Delete"}
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      {editing ? (
        <section className="mt-5">
          <FieldEditForm
            field={field}
            userId={userId}
            onCancel={() => setEditing(false)}
            onSaved={(updatedField) => {
              setField(updatedField);
              setEditing(false);
            }}
          />
        </section>
      ) : null}

      <section className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Info label={t("area")} value={formatArea(field.area, field.area_unit)} />
        <Info label="Ada / Parsel" value={[field.block_no, field.parcel_no].filter(Boolean).join(" / ") || "-"} />
        <Info label={t("currentCrop")} value={`${getCropSymbol(field.current_crop)} ${field.current_crop || "-"}`} />
        <Info label={t("plantingDate")} value={formatDate(field.planting_date)} />
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OperationHistory
          title={locale === "tr" ? "İşlem geçmişi" : "Operation history"}
          operations={operations}
          fields={[field]}
          showFieldName={false}
          maxHeightClass="max-h-[420px]"
          onDeleted={load}
        />

        <div className="min-w-0 rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-base font-bold">{t("plans")}</h2>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {plans.length ? (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-lg bg-stone-50 p-2.5 dark:bg-stone-950">
                  <p className="font-bold">{plan.title}</p>
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                    {formatDate(plan.planned_date)} - {plan.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400">{locale === "tr" ? "Bu tarla için plan yok." : "No plans for this field."}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-300 bg-white p-2.5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <p className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}
