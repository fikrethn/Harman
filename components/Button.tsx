import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
};

const variants = {
  primary:
    "bg-emerald-800 !text-white shadow-md hover:bg-emerald-900 dark:bg-emerald-500 dark:!text-stone-950 dark:hover:bg-emerald-400",
  secondary:
    "border border-stone-400 bg-[#fff7e8] !text-stone-950 hover:bg-[#ead8b6] dark:border-stone-700 dark:bg-stone-900 dark:!text-stone-50 dark:hover:bg-stone-800",
  ghost: "!text-stone-950 hover:bg-[#ead8b6] dark:!text-stone-100 dark:hover:bg-stone-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({ children, className, variant = "primary", href, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
