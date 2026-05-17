"use client";

import { OperationHistory } from "@/components/OperationHistory";
import type { Field, FieldOperation } from "@/types/database";

export function OperationList({
  operations,
  fields,
  onDeleted,
}: {
  operations: FieldOperation[];
  fields?: Field[];
  onDeleted?: () => void | Promise<void>;
}) {
  return <OperationHistory operations={operations} fields={fields} onDeleted={onDeleted} />;
}
