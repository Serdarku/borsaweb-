import { NextRequest, NextResponse } from "next/server";
import { getExchangeRate, getTcmbRates } from "@borsa/data";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  try {
    if (from && to) {
      const r = await getExchangeRate(from, to);
      return NextResponse.json(r);
    }
    const t = await getTcmbRates();
    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}