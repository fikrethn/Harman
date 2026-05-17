"use client";

import type { ReactNode } from "react";

export function PageHeader({
  eyebrow = "Harman",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/16 bg-emerald-950/42 px-3 py-2.5 text-white shadow-lg shadow-stone-950/10 backdrop-blur-md dark:bg-stone-950/54 sm:px-4 sm:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100/90">{eyebrow}</p>
          <h1 className="mt-0.5 text-lg font-black leading-tight sm:text-xl">{title}</h1>
          {description ? <p className="mt-0.5 max-w-3xl text-xs font-medium leading-5 text-emerald-50/86 sm:text-sm">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
    </section>
  );
}
