import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@borsa/data";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range = req.nextUrl.searchParams.get("range") || "6mo";
  const interval = req.nextUrl.searchParams.get("interval") || "1d";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  try {
    const bars = await getHistory(symbol, range, interval);
    return NextResponse.json(bars);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}