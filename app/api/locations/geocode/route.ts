import { NextRequest, NextResponse } from "next/server";

type GeocodingResult = {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  admin2?: string;
};

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") ?? "";
  const district = request.nextUrl.searchParams.get("district") ?? "";
  const neighborhood = request.nextUrl.searchParams.get("neighborhood") ?? "";

  if (!city || !district) {
    return NextResponse.json({ error: "city and district are required" }, { status: 400 });
  }

  const queries = [
    [neighborhood, district, city, "Türkiye"].filter(Boolean).join(", "),
    [district, city, "Türkiye"].filter(Boolean).join(", "),
    [city, "Türkiye"].filter(Boolean).join(", "),
  ];

  try {
    for (const query of queries) {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.searchParams.set("name", query);
      url.searchParams.set("count", "1");
      url.searchParams.set("language", "tr");
      url.searchParams.set("format", "json");

      const response = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } });
      if (!response.ok) continue;

      const data = (await response.json()) as { results?: GeocodingResult[] };
      const location = data.results?.[0];

      if (location) {
        return NextResponse.json({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            admin1: location.admin1,
            admin2: location.admin2,
          },
        });
      }
    }

    return NextResponse.json({ location: null });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
