"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "tr" | "en";

const dictionary = {
  tr: {
    dashboard: "Panel",
    fields: "Tarlalar",
    plans: "Planlar",
    weather: "Hava",
    settings: "Ayarlar",
    login: "Giriş Yap",
    register: "Kayıt Ol",
    logout: "Çıkış",
    add: "Ekle",
    addField: "Tarla Ekle",
    saveField: "Tarlayı Kaydet",
    addOperation: "İşlem Ekle",
    saveOperation: "İşlemi Kaydet",
    loading: "Yükleniyor...",
    saving: "Kaydediliyor...",
    noFields: "Henüz tarla yok",
    noFieldsText: "İlk tarlanızı ekleyerek başlayın.",
    noPlans: "Henüz plan yok.",
    noOperations: "Henüz işlem kaydı yok.",
    fieldName: "Tarla adı",
    city: "İl",
    district: "İlçe",
    neighborhood: "Mahalle / Köy",
    blockNo: "Ada no",
    parcelNo: "Parsel no",
    area: "Alan",
    areaUnit: "Alan birimi",
    currentCrop: "Ekili ürün",
    plantingDate: "Ekim tarihi",
    notes: "Notlar",
    date: "Tarih",
    operationType: "İşlem türü",
    material: "Kullanılan ürün / malzeme",
    amount: "Miktar",
    unit: "Birim",
    cost: "Maliyet",
    title: "Başlık",
    selectField: "Tarla seçin",
    completed: "Tamamlandı",
    cancelled: "İptal edildi",
    pending: "Bekliyor",
    fieldNotFound: "Tarla bulunamadı.",
    weatherUnavailable: "Hava durumu alınamadı.",
    profileSaved: "Profil kaydedildi.",
    email: "E-posta",
    password: "Şifre",
    fullName: "Ad soyad",
    processing: "İşleniyor...",
    accountMissing: "Hesabınız yok mu?",
    accountExists: "Zaten hesabınız var mı?",
    registerNow: "Kayıt olun",
    loginNow: "Giriş yapın",
    theme: "Tema",
    language: "Dil",
    light: "Açık",
    dark: "Koyu",
    tkgm: "TKGM’de Görüntüle",
  },
  en: {
    dashboard: "Dashboard",
    fields: "Fields",
    plans: "Plans",
    weather: "Weather",
    settings: "Settings",
    login: "Log In",
    register: "Sign Up",
    logout: "Log Out",
    add: "Add",
    addField: "Add Field",
    saveField: "Save Field",
    addOperation: "Add Operation",
    saveOperation: "Save Operation",
    loading: "Loading...",
    saving: "Saving...",
    noFields: "No fields yet",
    noFieldsText: "Add your first field to get started.",
    noPlans: "No plans yet.",
    noOperations: "No operation records yet.",
    fieldName: "Field name",
    city: "City",
    district: "District",
    neighborhood: "Neighborhood / Village",
    blockNo: "Block no",
    parcelNo: "Parcel no",
    area: "Area",
    areaUnit: "Area unit",
    currentCrop: "Current crop",
    plantingDate: "Planting date",
    notes: "Notes",
    date: "Date",
    operationType: "Operation type",
    material: "Product / material used",
    amount: "Amount",
    unit: "Unit",
    cost: "Cost",
    title: "Title",
    selectField: "Select field",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",
    fieldNotFound: "Field not found.",
    weatherUnavailable: "Weather could not be loaded.",
    profileSaved: "Profile saved.",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    processing: "Processing...",
    accountMissing: "Don’t have an account?",
    accountExists: "Already have an account?",
    registerNow: "Sign up",
    loginNow: "Log in",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    tkgm: "View on TKGM",
  },
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: (key: keyof typeof dictionary.tr) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("tr");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("harman-locale") as Locale | null;
    const savedTheme = window.localStorage.getItem("harman-theme") as "light" | "dark" | null;
    if (savedLocale === "tr" || savedLocale === "en") setLocaleState(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("harman-locale", locale);
    window.localStorage.setItem("harman-theme", theme);
  }, [locale, theme]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setLocaleState(nextLocale),
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      t: (key) => dictionary[locale][key],
    }),
    [locale, theme],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
