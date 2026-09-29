import { NextRequest, NextResponse } from "next/server";
import { forwardGeocode, fetchLocationSuggestions } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("text") || "";
    const mode = searchParams.get("mode") || "search"; // "search" | "autocomplete"

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    if (mode === "autocomplete") {
      const suggestions = await fetchLocationSuggestions(query);
      return NextResponse.json({ results: suggestions });
    }

    const result = await forwardGeocode(query);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("[Geocode API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to geocode" }, { status: 500 });
  }
}
