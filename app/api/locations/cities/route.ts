import { NextResponse } from "next/server";
import { formatLocationName, sortLocationOptions } from "@/lib/locations";

type BeteraliCity = {
  city_code: number;
  city_name: string;
};

export async function GET() {
  try {
    const response = await fetch("https://www.beterali.com/api/v1/cities", {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
    }

    const result = (await response.json()) as { data?: { cities?: BeteraliCity[] } };
    const items = sortLocationOptions(
      result.data?.cities?.map((city) => ({
        code: String(city.city_code),
        name: formatLocationName(city.city_name),
      })) ?? [],
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
  }
}
