import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@borsa/data";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  try {
    const n = await getNews(symbol, 10);
    return NextResponse.json(n);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}