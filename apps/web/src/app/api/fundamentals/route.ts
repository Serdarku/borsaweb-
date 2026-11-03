import { NextRequest, NextResponse } from "next/server";
import { getFundamentals } from "@borsa/data";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  try {
    const f = await getFundamentals(symbol);
    return NextResponse.json(f);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}