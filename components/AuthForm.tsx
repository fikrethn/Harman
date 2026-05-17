"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { useI18n } from "@/lib/i18n";
import { requireSupabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function AuthForm({ mode, glass = false }: { mode: "login" | "register"; glass?: boolean }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = requireSupabase();
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
          return;
        }
        setMessage(
          locale === "tr"
            ? "Kayıt oluşturuldu. E-posta doğrulaması açık olabilir; gelen kutunuzu kontrol edip sonra giriş yapın."
            : "Account created. Email confirmation may be enabled; check your inbox, then log in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : locale === "tr" ? "Bir hata oluştu." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginCode() {
    setResetLoading(true);
    setResetMessage("");

    try {
      const { error } = await requireSupabase().auth.signInWithOtp({
        email: resetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          shouldCreateUser: false,
        },
      });
      if (error) throw error;
      setCodeSent(true);
      setResetMessage(
        locale === "tr"
          ? "Eğer bu e-posta kayıtlıysa 6 haneli giriş kodu gönderildi. Gelen kutunuzu kontrol edin."
          : "If this email is registered, a 6-digit login code has been sent. Check your inbox.",
      );
    } catch (error) {
      setResetMessage(error instanceof Error ? error.message : locale === "tr" ? "Kod gönderilemedi." : "Code could not be sent.");
    } finally {
      setResetLoading(false);
    }
  }

  async function verifyLoginCode() {
    setResetLoading(true);
    setResetMessage("");

    try {
      const { error } = await requireSupabase().auth.verifyOtp({
        email: resetEmail,
        token: resetCode.replace(/\s/g, ""),
        type: "email",
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error) {
      setResetMessage(error instanceof Error ? error.message : locale === "tr" ? "Kod doğrulanamadı." : "Code could not be verified.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "grid gap-3.5 rounded-xl border p-4 shadow-sm",
        glass
          ? "auth-glass border-white/12 bg-stone-950/10 text-white shadow-none backdrop-blur-sm"
          : "border-stone-200 bg-white",
      )}
    >
      {mode === "register" ? (
        <FormInput label={t("fullName")} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      ) : null}
      <FormInput label={t("email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <FormInput
        label={t("password")}
        type="password"
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {message ? <p className={cn("rounded-lg p-3 text-sm", glass ? "bg-white/14 text-emerald-50" : "bg-stone-50 text-stone-700")}>{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t("processing") : mode === "register" ? t("register") : t("login")}
      </Button>
      {mode === "login" ? (
        <button
          type="button"
          onClick={() => {
            setForgotOpen((open) => !open);
            setResetEmail(email);
            setResetMessage("");
          }}
          className={cn(
            "justify-self-center text-xs font-black underline-offset-4 hover:underline",
            glass ? "text-emerald-50" : "text-emerald-900 dark:text-emerald-300",
          )}
        >
          {locale === "tr" ? "Şifremi unuttum" : "Forgot password"}
        </button>
      ) : null}
      {mode === "login" && forgotOpen ? (
        <div
          className={cn(
            "grid gap-2 rounded-lg border p-2.5",
            glass ? "border-white/20 bg-stone-950/18 text-white" : "border-emerald-800/20 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/30",
          )}
        >
          <div>
            <p className="text-sm font-black">{locale === "tr" ? "Kodla giriş" : "Sign in with code"}</p>
            <p className={cn("mt-0.5 text-xs", glass ? "text-emerald-50/85" : "text-stone-600 dark:text-stone-400")}>
              {locale === "tr"
                ? "Kayıtlı e-postanıza 6 haneli tek kullanımlık giriş kodu gönderilir."
                : "A 6-digit one-time login code is sent to your registered email."}
            </p>
          </div>
          {!codeSent ? (
            <div className="grid gap-2">
              <FormInput
                label={t("email")}
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                required
              />
              <Button type="button" onClick={sendLoginCode} disabled={resetLoading || !resetEmail}>
                {resetLoading ? t("processing") : locale === "tr" ? "Kod gönder" : "Send code"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <FormInput
                label={locale === "tr" ? "Giriş kodu" : "Login code"}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={resetCode}
                onChange={(event) => setResetCode(event.target.value)}
                required
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" onClick={verifyLoginCode} disabled={resetLoading || !resetCode}>
                  {resetLoading ? t("processing") : locale === "tr" ? "Kodla giriş yap" : "Sign in"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={resetLoading}
                  onClick={() => {
                    setCodeSent(false);
                    setResetCode("");
                    setResetMessage("");
                  }}
                >
                  {locale === "tr" ? "E-postayı değiştir" : "Change email"}
                </Button>
              </div>
            </div>
          )}
          {resetMessage ? (
            <p className={cn("rounded-md px-2 py-1.5 text-xs font-semibold", glass ? "bg-white/14 text-emerald-50" : "bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-200")}>
              {resetMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
