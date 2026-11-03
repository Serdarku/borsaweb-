import { NextRequest, NextResponse } from "next/server";
import { getCryptoHistory } from "@borsa/data";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "bitcoin";
  const days = +(req.nextUrl.searchParams.get("days") || "90");
  const vs = req.nextUrl.searchParams.get("vs") || "usd";
  try {
    const h = await getCryptoHistory(id, days, vs);
    return NextResponse.json(h);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}