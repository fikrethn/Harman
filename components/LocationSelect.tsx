"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormSelect } from "@/components/FormInput";
import { useI18n } from "@/lib/i18n";

type LocationOption = {
  code: string;
  name: string;
};

type LocationResponse = {
  items?: LocationOption[];
};

export type SelectedLocation = {
  city?: LocationOption;
  district?: LocationOption;
  neighborhood?: LocationOption;
};

async function fetchOptions(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location list could not be loaded.");
  const data = (await response.json()) as LocationResponse;
  return data.items ?? [];
}

export function LocationSelect({
  initialCityCode = "",
  initialDistrictCode = "",
  initialNeighborhoodCode = "",
  namePrefix = "",
  onLocationChange,
}: {
  initialCityCode?: string | null;
  initialDistrictCode?: string | null;
  initialNeighborhoodCode?: string | null;
  namePrefix?: string;
  onLocationChange?: (location: SelectedLocation) => void;
}) {
  const { locale, t } = useI18n();
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [neighborhoodCode, setNeighborhoodCode] = useState("");
  const [loading, setLoading] = useState<"cities" | "districts" | "neighborhoods" | null>("cities");
  const [error, setError] = useState("");
  const appliedInitialCity = useRef(false);
  const appliedInitialDistrict = useRef(false);
  const appliedInitialNeighborhood = useRef(false);

  const selectedCity = useMemo(() => cities.find((city) => city.code === cityCode), [cities, cityCode]);
  const selectedDistrict = useMemo(
    () => districts.find((district) => district.code === districtCode),
    [districts, districtCode],
  );
  const selectedNeighborhood = useMemo(
    () => neighborhoods.find((neighborhood) => neighborhood.code === neighborhoodCode),
    [neighborhoods, neighborhoodCode],
  );

  useEffect(() => {
    fetchOptions("/api/locations/cities")
      .then(setCities)
      .catch(() => setError(locale === "tr" ? "İl listesi alınamadı." : "Could not load provinces."))
      .finally(() => setLoading(null));
  }, [locale]);

  useEffect(() => {
    if (!appliedInitialCity.current && initialCityCode && cities.length) {
      setCityCode(initialCityCode);
      appliedInitialCity.current = true;
    }
  }, [cities, initialCityCode]);

  useEffect(() => {
    if (!appliedInitialDistrict.current && initialDistrictCode && districts.length) {
      setDistrictCode(initialDistrictCode);
      appliedInitialDistrict.current = true;
    }
  }, [districts, initialDistrictCode]);

  useEffect(() => {
    if (!appliedInitialNeighborhood.current && initialNeighborhoodCode && neighborhoods.length) {
      setNeighborhoodCode(initialNeighborhoodCode);
      appliedInitialNeighborhood.current = true;
    }
  }, [neighborhoods, initialNeighborhoodCode]);

  useEffect(() => {
    if (!cityCode) {
      setDistricts([]);
      setDistrictCode("");
      setNeighborhoods([]);
      setNeighborhoodCode("");
      return;
    }

    setLoading("districts");
    setDistricts([]);
    setDistrictCode("");
    setNeighborhoods([]);
    setNeighborhoodCode("");
    fetchOptions(`/api/locations/districts?cityCode=${cityCode}`)
      .then(setDistricts)
      .catch(() => setError(locale === "tr" ? "İlçe listesi alınamadı." : "Could not load districts."))
      .finally(() => setLoading(null));
  }, [cityCode, locale]);

  useEffect(() => {
    if (!districtCode) {
      setNeighborhoods([]);
      setNeighborhoodCode("");
      return;
    }

    setLoading("neighborhoods");
    setNeighborhoods([]);
    setNeighborhoodCode("");
    fetchOptions(`/api/locations/neighborhoods?districtCode=${districtCode}`)
      .then(setNeighborhoods)
      .catch(() => setError(locale === "tr" ? "Mahalle/köy listesi alınamadı." : "Could not load neighborhoods."))
      .finally(() => setLoading(null));
  }, [districtCode, locale]);

  useEffect(() => {
    onLocationChange?.({
      city: selectedCity,
      district: selectedDistrict,
      neighborhood: selectedNeighborhood,
    });
  }, [onLocationChange, selectedCity, selectedDistrict, selectedNeighborhood]);

  return (
    <div className="grid gap-3">
      <input type="hidden" name={`${namePrefix}city`} value={selectedCity?.name ?? ""} />
      <input type="hidden" name={`${namePrefix}city_code`} value={selectedCity?.code ?? ""} />
      <input type="hidden" name={`${namePrefix}district`} value={selectedDistrict?.name ?? ""} />
      <input type="hidden" name={`${namePrefix}district_code`} value={selectedDistrict?.code ?? ""} />
      <input type="hidden" name={`${namePrefix}neighborhood`} value={selectedNeighborhood?.name ?? ""} />
      <input type="hidden" name={`${namePrefix}neighborhood_code`} value={selectedNeighborhood?.code ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FormSelect label={t("city")} value={cityCode} onChange={(event) => setCityCode(event.target.value)} required>
            <option value="">{loading === "cities" ? t("loading") : locale === "tr" ? "İl seçin" : "Select province"}</option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </FormSelect>
          <p className="mt-1 text-xs font-semibold text-stone-600">
            {cities.length
              ? locale === "tr"
                ? `${cities.length} il yüklendi`
                : `${cities.length} provinces loaded`
              : locale === "tr"
                ? "İller yükleniyor"
                : "Loading provinces"}
          </p>
        </div>

        <div>
          <FormSelect
            label={t("district")}
            value={districtCode}
            onChange={(event) => setDistrictCode(event.target.value)}
            disabled={!cityCode || loading === "districts"}
            required
          >
            <option value="">
              {loading === "districts"
                ? t("loading")
                : cityCode
                  ? locale === "tr"
                    ? "İlçe seçin"
                    : "Select district"
                  : locale === "tr"
                    ? "Önce il seçin"
                    : "Select province first"}
            </option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </FormSelect>
          {cityCode ? (
            <p className="mt-1 text-xs font-semibold text-stone-600">
              {loading === "districts"
                ? t("loading")
                : locale === "tr"
                  ? `${districts.length} ilçe`
                  : `${districts.length} districts`}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <FormSelect
          label={t("neighborhood")}
          value={neighborhoodCode}
          onChange={(event) => setNeighborhoodCode(event.target.value)}
          disabled={!districtCode || loading === "neighborhoods"}
        >
          <option value="">
            {loading === "neighborhoods"
              ? t("loading")
              : districtCode
                ? locale === "tr"
                  ? "Mahalle / köy seçin"
                  : "Select neighborhood"
                : locale === "tr"
                  ? "Önce ilçe seçin"
                  : "Select district first"}
          </option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood.code} value={neighborhood.code}>
              {neighborhood.name}
            </option>
          ))}
        </FormSelect>
        {districtCode ? (
          <p className="mt-1 text-xs font-semibold text-stone-600">
            {loading === "neighborhoods"
              ? t("loading")
              : locale === "tr"
                ? `${neighborhoods.length} mahalle/köy`
                : `${neighborhoods.length} neighborhoods`}
          </p>
        ) : null}
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
