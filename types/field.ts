export const operationTypes = [
  "Ekim",
  "Gübreleme",
  "İlaçlama",
  "Sulama",
  "Hasat",
  "Toprak işleme",
  "Diğer",
] as const;

export const areaUnits = [
  { value: "m2", label: "m2" },
  { value: "dekar", label: "dekar" },
  { value: "hektar", label: "hektar" },
] as const;

export const measurementUnits = [
  { value: "gram", label: "gram" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "ton" },
  { value: "ml", label: "ml" },
  { value: "litre", label: "litre" },
  { value: "adet", label: "adet" },
  { value: "paket", label: "paket" },
  { value: "çuval", label: "çuval" },
  { value: "kasa", label: "kasa" },
  { value: "rulo", label: "rulo" },
  { value: "kg/dekar", label: "kg/dekar" },
  { value: "litre/dekar", label: "litre/dekar" },
  { value: "ton/dekar", label: "ton/dekar" },
] as const;

export const crops = [
  { value: "Antep fıstığı", label: "Antep fıstığı", symbol: "🥜" },
  { value: "Armut", label: "Armut", symbol: "🍐" },
  { value: "Arpa", label: "Arpa", symbol: "🌾" },
  { value: "Ayçiçeği", label: "Ayçiçeği", symbol: "🌻" },
  { value: "Badem", label: "Badem", symbol: "🥜" },
  { value: "Bezelye", label: "Bezelye", symbol: "🫛" },
  { value: "Biber", label: "Biber", symbol: "🌶️" },
  { value: "Buğday", label: "Buğday", symbol: "🌾" },
  { value: "Ceviz", label: "Ceviz", symbol: "🌰" },
  { value: "Çavdar", label: "Çavdar", symbol: "🌾" },
  { value: "Çeltik", label: "Çeltik", symbol: "🍚" },
  { value: "Domates", label: "Domates", symbol: "🍅" },
  { value: "Elma", label: "Elma", symbol: "🍎" },
  { value: "Fasulye", label: "Fasulye", symbol: "🫘" },
  { value: "Fındık", label: "Fındık", symbol: "🌰" },
  { value: "Fiğ", label: "Fiğ", symbol: "☘️" },
  { value: "Havuç", label: "Havuç", symbol: "🥕" },
  { value: "İncir", label: "İncir", symbol: "🟣" },
  { value: "Kanola", label: "Kanola", symbol: "🌼" },
  { value: "Karpuz", label: "Karpuz", symbol: "🍉" },
  { value: "Kavun", label: "Kavun", symbol: "🍈" },
  { value: "Kiraz", label: "Kiraz", symbol: "🍒" },
  { value: "Mercimek", label: "Mercimek", symbol: "🟠" },
  { value: "Mısır", label: "Mısır", symbol: "🌽" },
  { value: "Nohut", label: "Nohut", symbol: "🟡" },
  { value: "Pamuk", label: "Pamuk", symbol: "☁️" },
  { value: "Patates", label: "Patates", symbol: "🥔" },
  { value: "Salatalık", label: "Salatalık", symbol: "🥒" },
  { value: "Soğan", label: "Soğan", symbol: "🧅" },
  { value: "Susam", label: "Susam", symbol: "⚪" },
  { value: "Şeker pancarı", label: "Şeker pancarı", symbol: "🟤" },
  { value: "Üzüm", label: "Üzüm", symbol: "🍇" },
  { value: "Yonca", label: "Yonca", symbol: "☘️" },
  { value: "Yulaf", label: "Yulaf", symbol: "🌾" },
  { value: "Zeytin", label: "Zeytin", symbol: "🫒" },
] as const;

export function getCropSymbol(crop?: string | null) {
  return crops.find((item) => item.value === crop)?.symbol ?? "🌱";
}
