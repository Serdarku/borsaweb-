import { NextRequest, NextResponse } from "next/server";
import { getEvdsSeries } from "@borsa/data";

export async function GET(req: NextRequest) {
  const series = req.nextUrl.searchParams.get("series") || "TP.DK.USD.A";
  const start = req.nextUrl.searchParams.get("start") || "01-01-2024";
  const end = req.nextUrl.searchParams.get("end") || "31-12-2025";
  try {
    const r = await getEvdsSeries(series, start, end);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}