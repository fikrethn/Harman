"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { FieldForm } from "@/components/FieldForm";
import { useI18n } from "@/lib/i18n";

export default function NewFieldPage() {
  const { locale, t } = useI18n();

  return (
    <AuthGuard>
      {() => (
        <main className="mx-auto max-w-3xl px-3 pb-20 pt-3 md:pb-8">
          <h1 className="text-xl font-black">{t("addField")}</h1>
          <p className="mt-1 text-stone-700 dark:text-stone-300">
            {locale === "tr" ? "Konum, ada/parsel, alan ve ekili ürün bilgilerini girin." : "Enter location, parcel, area and crop details."}
          </p>
          <div className="mt-5">
            <FieldForm />
          </div>
        </main>
      )}
    </AuthGuard>
  );
}
