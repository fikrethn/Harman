export type LocationOption = {
  code: string;
  name: string;
};

const lowerCaseWords = new Set(["ve", "ile"]);

export function formatLocationName(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && lowerCaseWords.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1);
    })
    .join(" ");
}

export function sortLocationOptions(items: LocationOption[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "tr-TR", { sensitivity: "base" }));
}
