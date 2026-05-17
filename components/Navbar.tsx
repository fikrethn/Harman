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

  if (isAuthPage) {
    return (
      <div className="auth-floating-actions">
        <button
          type="button"
          onClick={toggleTheme}
          title={t("theme")}
          className="grid size-9 place-items-center rounded-md border border-white/16 bg-stone-950/20 !text-white shadow-sm backdrop-blur-md transition hover:bg-white/16 hover:!text-white"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          type="button"
          onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
          title={t("language")}
          className="inline-flex size-9 items-center justify-center gap-1 rounded-md border border-white/16 bg-stone-950/20 text-[11px] font-black !text-white shadow-sm backdrop-blur-md transition hover:bg-white/16 hover:!text-white"
        >
          <Languages size={15} />
          {locale.toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-emerald-950 bg-emerald-950/96 shadow-lg shadow-stone-950/15 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-1.5">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-black !text-white dark:text-emerald-100">
            <span className="grid size-8 place-items-center rounded-md bg-emerald-500 text-emerald-950 shadow-sm dark:bg-emerald-500 dark:text-stone-950">
              <Sprout size={17} />
            </span>
            Harman
          </Link>

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

        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={signOut} className="hidden lg:inline-flex">
              <LogOut size={16} />
              {t("logout")}
            </Button>
          <button
            type="button"
            onClick={toggleTheme}
            title={t("theme")}
            className="grid size-8 place-items-center rounded-md border border-emerald-700 bg-emerald-900 !text-emerald-50 shadow-sm transition hover:bg-emerald-800 hover:!text-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
            title={t("language")}
            className="inline-flex size-8 items-center justify-center gap-1 rounded-md border border-emerald-700 bg-emerald-900 text-[11px] font-black !text-emerald-50 shadow-sm transition hover:bg-emerald-800 hover:!text-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
          >
            <Languages size={14} />
            {locale.toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
