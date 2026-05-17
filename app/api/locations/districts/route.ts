import { NextRequest, NextResponse } from "next/server";
import { formatLocationName, sortLocationOptions } from "@/lib/locations";

type BeteraliDistrict = {
  district_code: number;
  district_name: string;
};

export async function GET(request: NextRequest) {
  const cityCode = request.nextUrl.searchParams.get("cityCode");
  if (!cityCode || !/^\d+$/.test(cityCode)) {
    return NextResponse.json({ error: "cityCode is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.beterali.com/api/v1/districts?city_code=${cityCode}`, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
    }

    const result = (await response.json()) as { data?: { districts?: BeteraliDistrict[] } };
    const items = sortLocationOptions(
      result.data?.districts?.map((district) => ({
        code: String(district.district_code),
        name: formatLocationName(district.district_name),
      })) ?? [],
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Location service unavailable" }, { status: 502 });
  }
}
