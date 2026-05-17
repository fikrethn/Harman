"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { requireSupabase } from "@/lib/supabaseClient";
import type { Field, FieldOperation } from "@/types/database";

type OperationHistoryProps = {
  operations: FieldOperation[];
  fields?: Field[];
  title?: string;
  maxItems?: number;
  maxHeightClass?: string;
  showFieldName?: boolean;
  onDeleted?: () => void | Promise<void>;
};

export function OperationHistory({
  operations,
  fields = [],
  title,
  maxItems,
  maxHeightClass = "max-h-[360px]",
  showFieldName = true,
  onDeleted,
}: OperationHistoryProps) {
  const { locale, t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fieldMap = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const sortedOperations = useMemo(() => [...operations].sort(compareOperationsNewestFirst), [operations]);
  const visibleOperations = maxItems ? sortedOperations.slice(0, maxItems) : sortedOperations;
  const selectedOperation = sortedOperations.find((operation) => operation.id === selectedId) ?? null;
  const selectedGroup = selectedOperation ? sortedOperations.filter((operation) => isSameOperationBatch(operation, selectedOperation)) : [];

  async function deleteSelectedGroup() {
    if (!selectedOperation || !selectedGroup.length) return;

    const confirmed = window.confirm(
      locale === "tr"
        ? `${selectedGroup.length} işlem kaydı silinecek. Devam edilsin mi?`
        : `${selectedGroup.length} operation records will be deleted. Continue?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await requireSupabase()
      .from("field_operations")
      .delete()
      .in("id", selectedGroup.map((operation) => operation.id));
    setDeleting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    setSelectedId(null);
    await onDeleted?.();
  }

  if (!sortedOperations.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-400 bg-white/70 p-3 text-sm text-stone-700 dark:bg-stone-900/70 dark:text-stone-300">
        {t("noOperations")}
      </div>
    );
  }

  return (
    <>
      <section className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        {title ? <h2 className="text-base font-black">{title}</h2> : null}
        <div className={`mt-3 overflow-y-auto pr-1 ${maxHeightClass}`}>
          <div className="grid gap-2">
            {visibleOperations.map((operation) => {
              const field = fieldMap.get(operation.field_id);
              return (
                <button
                  key={operation.id}
                  type="button"
                  onClick={() => setSelectedId(operation.id)}
                  className="group w-full rounded-lg border border-transparent bg-stone-50 p-2.5 text-left transition hover:border-emerald-700 hover:bg-emerald-50 dark:bg-stone-950 dark:hover:bg-emerald-950/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{operation.operation_type}</p>
                      {showFieldName ? (
                        <p className="mt-0.5 truncate text-xs font-semibold text-stone-600 dark:text-stone-400">
                          {field?.name ?? (locale === "tr" ? "Tarla bulunamadı" : "Field not found")}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs font-bold text-stone-500 dark:text-stone-400">{formatDate(operation.operation_date)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-stone-600 dark:text-stone-400">
                    {[operation.material_name, operation.amount?.toLocaleString("tr-TR"), operation.unit].filter(Boolean).join(" ") ||
                      (locale === "tr" ? "Malzeme bilgisi yok" : "No material")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedOperation ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/55 p-3 backdrop-blur-sm">
          <section className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-emerald-900/20 bg-[#fff7e8] p-3 shadow-2xl dark:border-stone-700 dark:bg-stone-950">
            <div className="flex items-start justify-between gap-3 border-b border-stone-300 pb-3 dark:border-stone-800">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
                  {locale === "tr" ? "İşlem detayı" : "Operation detail"}
                </p>
                <h3 className="mt-1 text-lg font-black">{selectedOperation.operation_type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                aria-label={locale === "tr" ? "Detayı kapat" : "Close detail"}
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Detail label={locale === "tr" ? "Tarih" : "Date"} value={formatDate(selectedOperation.operation_date)} />
              <Detail label={locale === "tr" ? "Kayıt sayısı" : "Record count"} value={`${selectedGroup.length}`} />
              <Detail label={locale === "tr" ? "Malzeme / ürün" : "Material / crop"} value={selectedOperation.material_name || "-"} />
              <Detail
                label={locale === "tr" ? "Miktar" : "Amount"}
                value={[selectedOperation.amount?.toLocaleString("tr-TR"), selectedOperation.unit].filter(Boolean).join(" ") || "-"}
              />
              <Detail
                label={locale === "tr" ? "Maliyet" : "Cost"}
                value={selectedOperation.cost ? `${selectedOperation.cost.toLocaleString("tr-TR")} TL` : "-"}
              />
              <Detail label={locale === "tr" ? "Oluşturulma" : "Created"} value={formatDate(selectedOperation.created_at)} />
            </div>

            <div className="mt-3 rounded-lg bg-white p-2 dark:bg-stone-900">
              <p className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                {locale === "tr" ? "Uygulanan tarlalar" : "Applied fields"}
              </p>
              <div className="mt-2 grid max-h-48 gap-1.5 overflow-y-auto pr-1">
                {selectedGroup.map((operation) => {
                  const field = fieldMap.get(operation.field_id);
                  return field ? (
                    <Link
                      key={operation.id}
                      href={`/fields/${field.id}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-stone-50 px-2 py-1.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800"
                    >
                      <span className="min-w-0 truncate">
                        {field.name}
                        <span className="font-normal text-stone-500 dark:text-stone-400"> - {field.district} / {field.city}</span>
                      </span>
                      <ExternalLink size={13} className="shrink-0 text-emerald-800 dark:text-emerald-300" />
                    </Link>
                  ) : (
                    <div key={operation.id} className="rounded-md bg-stone-50 px-2 py-1.5 text-sm text-stone-600 dark:bg-stone-950 dark:text-stone-400">
                      {locale === "tr" ? "Tarla kaydı bulunamadı." : "Field record not found."}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedOperation.notes ? (
              <div className="mt-3 rounded-lg bg-white p-2 dark:bg-stone-900">
                <p className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">{locale === "tr" ? "Not" : "Notes"}</p>
                <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{selectedOperation.notes}</p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-stone-300 pt-3 dark:border-stone-800">
              <Button type="button" variant="danger" onClick={deleteSelectedGroup} disabled={deleting}>
                <Trash2 size={14} />
                {deleting ? t("saving") : locale === "tr" ? "İşlem grubunu sil" : "Delete operation group"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setSelectedId(null)}>
                {locale === "tr" ? "Kapat" : "Close"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-2 py-1.5 dark:bg-stone-900">
      <p className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-black">{value}</p>
    </div>
  );
}

export function compareOperationsNewestFirst(a: FieldOperation, b: FieldOperation) {
  const dateDiff = new Date(b.operation_date).getTime() - new Date(a.operation_date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function isSameOperationBatch(operation: FieldOperation, selected: FieldOperation) {
  return (
    operation.created_at === selected.created_at &&
    operation.operation_type === selected.operation_type &&
    operation.operation_date === selected.operation_date &&
    operation.material_name === selected.material_name &&
    operation.amount === selected.amount &&
    operation.unit === selected.unit &&
    operation.cost === selected.cost &&
    operation.notes === selected.notes
  );
}
