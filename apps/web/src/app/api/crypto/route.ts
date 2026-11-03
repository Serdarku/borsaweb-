import { NextRequest, NextResponse } from "next/server";
import { getCryptoPrice } from "@borsa/data";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "bitcoin";
  const vs = req.nextUrl.searchParams.get("vs") || "usd";
  try {
    const r = await getCryptoPrice(id, vs);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}