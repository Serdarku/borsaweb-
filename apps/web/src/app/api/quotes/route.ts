import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@borsa/data";

export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get("symbols") || "").split(",").filter(Boolean);
  if (symbols.length === 0) return NextResponse.json({ error: "symbols required" }, { status: 400 });
  try {
    const q = await getQuotes(symbols);
    return NextResponse.json(q);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}