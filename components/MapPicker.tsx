"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";

const MapPickerCanvas = dynamic(() => import("@/components/MapPickerCanvas").then((mod) => mod.MapPickerCanvas), {
  ssr: false,
});

export function MapPicker({
  latitude,
  longitude,
  focusLatitude,
  focusLongitude,
  focusZoom = 10,
  onPick,
}: {
  latitude?: number | null;
  longitude?: number | null;
  focusLatitude?: number | null;
  focusLongitude?: number | null;
  focusZoom?: number;
  onPick: (coords: { latitude: number; longitude: number }) => void;
}) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ latitude: number; longitude: number } | null>(
    latitude && longitude ? { latitude, longitude } : null,
  );

  const center = useMemo<[number, number]>(() => {
    if (draft) return [draft.latitude, draft.longitude];
    if (latitude && longitude) return [latitude, longitude];
    if (focusLatitude && focusLongitude) return [focusLatitude, focusLongitude];
    return [39.0, 35.0];
  }, [draft, focusLatitude, focusLongitude, latitude, longitude]);

  const selectedPoint = draft ?? (latitude && longitude ? { latitude, longitude } : null);
  const zoom = draft || (latitude && longitude) ? 16 : focusLatitude && focusLongitude ? focusZoom : 6;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {locale === "tr" ? "Haritadan seç" : "Pick on map"}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-stone-950/55 p-0 sm:place-items-center sm:p-3">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-t-lg border border-stone-300 bg-white shadow-2xl dark:border-stone-700 sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-stone-300 p-3 dark:border-stone-700">
              <div>
                <h2 className="text-base font-black">{locale === "tr" ? "Haritadan konum seç" : "Pick location on map"}</h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {locale === "tr"
                    ? "Uydu görüntüsünde tarlanın veya hava tahmini noktasının üzerine tıklayın."
                    : "Click the field or weather forecast point on the satellite map."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm font-bold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                {locale === "tr" ? "Kapat" : "Close"}
              </button>
            </div>

            <div className="h-[58vh] min-h-[360px]">
              <MapPickerCanvas center={center} zoom={zoom} selected={selectedPoint} onPick={setDraft} />
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-300 p-3 dark:border-stone-700 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                {selectedPoint
                  ? `${selectedPoint.latitude.toFixed(6)}, ${selectedPoint.longitude.toFixed(6)}`
                  : locale === "tr"
                    ? "Henüz nokta seçilmedi."
                    : "No point selected yet."}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {locale === "tr" ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  disabled={!selectedPoint}
                  onClick={() => {
                    if (!selectedPoint) return;
                    onPick(selectedPoint);
                    setOpen(false);
                  }}
                >
                  {locale === "tr" ? "Bu konumu kullan" : "Use this location"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
