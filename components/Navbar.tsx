"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Languages, LogOut, Moon, Sprout, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const links = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/fields", labelKey: "fields" },
  { href: "/plans", labelKey: "plans" },
  { href: "/weather", labelKey: "weather" },
  { href: "/settings", labelKey: "settings" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, theme, toggleTheme, t } = useI18n();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/";

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  return (
    <header
      className={cn(
        "z-30",
        isAuthPage
          ? "pointer-events-none fixed right-3 top-3 z-50 w-max border-0 bg-transparent shadow-none"
          : "sticky top-0 border-b border-emerald-950 bg-emerald-950/96 shadow-lg shadow-stone-950/15 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          isAuthPage
            ? "pointer-events-none justify-end gap-2 p-0"
            : "mx-auto max-w-6xl justify-between px-3 py-1.5",
        )}
      >
        {isAuthPage ? (
          <span aria-hidden="true" />
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-black !text-white dark:text-emerald-100">
            <span className="grid size-8 place-items-center rounded-md bg-emerald-500 text-emerald-950 shadow-sm dark:bg-emerald-500 dark:text-stone-950">
              <Sprout size={17} />
            </span>
            Harman
          </Link>
        )}

        {!isAuthPage ? (
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-semibold !text-emerald-50 transition hover:bg-emerald-800 hover:!text-white dark:text-stone-200 dark:hover:bg-stone-800",
                  pathname.startsWith(link.href) &&
                    "bg-emerald-500 !text-emerald-950 hover:bg-emerald-400 hover:!text-emerald-950 dark:bg-emerald-500 dark:!text-stone-950",
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className={cn("flex items-center gap-2", isAuthPage && "pointer-events-auto")}>
          {!isAuthPage ? (
            <Button variant="secondary" onClick={signOut} className="hidden lg:inline-flex">
              <LogOut size={16} />
              {t("logout")}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={toggleTheme}
            title={t("theme")}
            className={cn(
              "grid size-8 place-items-center rounded-md shadow-sm transition",
              isAuthPage
                ? "border border-white/16 bg-white/10 !text-white backdrop-blur-md hover:bg-white/16 hover:!text-white"
                : "border border-emerald-700 bg-emerald-900 !text-emerald-50 hover:bg-emerald-800 hover:!text-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800",
            )}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
            title={t("language")}
            className={cn(
              "inline-flex size-8 items-center justify-center gap-1 rounded-md text-[11px] font-black shadow-sm transition",
              isAuthPage
                ? "border border-white/16 bg-white/10 !text-white backdrop-blur-md hover:bg-white/16 hover:!text-white"
                : "border border-emerald-700 bg-emerald-900 !text-emerald-50 hover:bg-emerald-800 hover:!text-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800",
            )}
          >
            <Languages size={14} />
            {locale.toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
