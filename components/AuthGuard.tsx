"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: (user: User) => ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, [router]);

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-3 py-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <h1 className="font-bold">Supabase ayarlari eksik</h1>
          <p className="mt-2 text-sm">.env.local dosyasina NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin.</p>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return <main className="mx-auto max-w-6xl px-3 py-6 text-stone-600">{t("loading")}</main>;
  }

  return children(user);
}
