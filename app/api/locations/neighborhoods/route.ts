import { NextRequest, NextResponse } from "next/server";
import { formatLocationName, sortLocationOptions } from "@/lib/locations";

type BeteraliNeighborhood = {
  neighbourhood_code: number;
  neighbourhood_name: string;
};

export async function GET(request: NextRequest) {
  const districtCode = request.nextUrl.searchParams.get("districtCode");
  if (!districtCode || !/^\d+$/.test(districtCode)) {
    return NextResponse.json({ error: "districtCode is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.beterali.com/api/v1/neighbourhoods?districts_code=${districtCode}`, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
    }

    const result = (await response.json()) as { data?: { neighbourhoods?: BeteraliNeighborhood[] } };
    const items = sortLocationOptions(
      result.data?.neighbourhoods?.map((neighborhood) => ({
        code: String(neighborhood.neighbourhood_code),
        name: formatLocationName(neighborhood.neighbourhood_name),
      })) ?? [],
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
  }
}
