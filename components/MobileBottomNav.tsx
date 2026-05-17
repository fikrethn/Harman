"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CloudSun, Home, MapPinned, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", labelKey: "dashboard", icon: Home },
  { href: "/fields", labelKey: "fields", icon: MapPinned },
  { href: "/plans", labelKey: "plans", icon: CalendarCheck },
  { href: "/weather", labelKey: "weather", icon: CloudSun },
  { href: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;
  if (!portalTarget) return null;

  return createPortal(
    <nav
      className="mobile-bottom-nav border-t border-emerald-950 bg-emerald-950 shadow-[0_-8px_24px_rgba(28,25,23,0.22)] dark:border-stone-800 dark:bg-stone-950"
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 2147483647,
      }}
    >
      <div className="safe-bottom grid grid-cols-5 px-2 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-bold !text-emerald-50 dark:text-stone-400",
                active && "bg-emerald-500 !text-emerald-950 dark:bg-emerald-500 dark:!text-stone-950",
              )}
            >
              <Icon size={16} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>,
    portalTarget,
  );
}
