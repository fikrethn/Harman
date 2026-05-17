"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CloudSun, KeyRound, LogOut, Mail, Settings2, UserRound } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { WeatherLocationForm } from "@/components/WeatherLocationForm";
import { useI18n } from "@/lib/i18n";
import { requireSupabase, supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/database";

export default function SettingsPage() {
  return (
    <AuthGuard>
      {(user) => <Settings userId={user.id} email={user.email ?? ""} />}
    </AuthGuard>
  );
}

function Settings({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await requireSupabase().from("profiles").select("*").eq("id", userId).single();
      const loaded = data as Profile | null;
      setProfile(loaded);
      setFullName(loaded?.full_name ?? "");
    }
    load();
  }, [userId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await requireSupabase()
      .from("profiles")
      .upsert({ id: userId, full_name: fullName })
      .select("*")
      .single();
    if (data) setProfile(data as Profile);
    setMessage(error ? error.message : t("profileSaved"));
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");

    setPasswordMessage("");

    if (password.length < 6) {
      setPasswordMessage(locale === "tr" ? "Şifre en az 6 karakter olmalı." : "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMessage(locale === "tr" ? "Şifreler aynı değil." : "Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await requireSupabase().auth.updateUser({ password });
    setPasswordSaving(false);

    if (error) {
      setPasswordMessage(error.message);
      return;
    }

    formElement.reset();
    setPasswordMessage(locale === "tr" ? "Şifre güncellendi." : "Password updated.");
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-3 md:pb-8">
      <section className="overflow-hidden rounded-xl border border-emerald-950/15 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="flex flex-col justify-between gap-3 bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 px-4 py-3 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Harman</p>
            <h1 className="mt-0.5 text-xl font-black">{t("settings")}</h1>
            <p className="mt-1 text-xs text-emerald-50">
              {locale === "tr" ? "Profil, hava adresi ve oturum ayarları tek ekranda." : "Profile, weather address and session settings in one view."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge icon={<Mail size={13} />} text={email || "-"} />
            <Badge icon={<CloudSun size={13} />} text={profile?.weather_city || (locale === "tr" ? "Hava adresi yok" : "No weather address")} />
          </div>
        </div>

        <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="grid content-start gap-3">
            <form onSubmit={save} className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-950">
              <CardTitle icon={<UserRound size={15} />} title={locale === "tr" ? "Profil" : "Profile"} />
              <div className="mt-3 grid gap-2">
                <FormInput label={t("email")} value={email} disabled />
                <FormInput label={t("fullName")} value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              {message ? <p className="mt-2 rounded-md bg-stone-50 px-2 py-1.5 text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-200">{message}</p> : null}
              <Button type="submit" className="mt-3">{locale === "tr" ? "Kaydet" : "Save"}</Button>
            </form>

            <form onSubmit={changePassword} className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-950">
              <CardTitle icon={<KeyRound size={15} />} title={locale === "tr" ? "Şifre" : "Password"} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <FormInput name="password" label={locale === "tr" ? "Yeni şifre" : "New password"} type="password" minLength={6} autoComplete="new-password" required />
                <FormInput name="confirm_password" label={locale === "tr" ? "Tekrar" : "Confirm"} type="password" minLength={6} autoComplete="new-password" required />
              </div>
              {passwordMessage ? (
                <p className="mt-2 rounded-md bg-stone-50 px-2 py-1.5 text-xs font-semibold text-stone-700 dark:bg-stone-900 dark:text-stone-200">{passwordMessage}</p>
              ) : null}
              <Button type="submit" disabled={passwordSaving} className="mt-3">
                {passwordSaving ? t("saving") : locale === "tr" ? "Güncelle" : "Update"}
              </Button>
            </form>

            <div className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-950">
              <CardTitle icon={<Settings2 size={15} />} title={locale === "tr" ? "Oturum" : "Session"} />
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                {locale === "tr" ? "Tema ve dil üst menüden değişir." : "Theme and language are controlled from the top bar."}
              </p>
              <Button variant="danger" onClick={signOut} className="mt-3">
                <LogOut size={14} /> {t("logout")}
              </Button>
            </div>
          </div>

          <WeatherLocationForm profile={profile} userId={userId} onSaved={setProfile} />
        </div>
      </section>
    </main>
  );
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-black">
      <span className="grid size-7 place-items-center rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{icon}</span>
      {title}
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-md border border-white/15 bg-white/12 px-2 py-1 text-xs font-bold text-emerald-50">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}
