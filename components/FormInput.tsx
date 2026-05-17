import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
};

export function FormInput({ label, error, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-stone-800 dark:text-stone-100">
      {label}
      <input
        className="min-h-9 w-full min-w-0 rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-950"
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function FormSelect({
  label,
  children,
  error,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-stone-800 dark:text-stone-100">
      {label}
      <select
        className="min-h-9 w-full min-w-0 rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-950"
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function FormTextarea({ label, error, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-stone-800 dark:text-stone-100">
      {label}
      <textarea
        className="min-h-24 w-full min-w-0 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-950"
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
