import { NextRequest, NextResponse } from "next/server";
import { getQuote, getHistory } from "@borsa/data";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "THYAO";
  try {
    const quote = await getQuote(symbol);
    const history = await getHistory(symbol, "1mo", "1d");
    return NextResponse.json({ quote, historyCount: history.length, lastBar: history[history.length - 1] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}