import { NextResponse } from "next/server";
import { getIndexQuote } from "@borsa/data";

export async function GET() {
  try {
    const idx = await getIndexQuote("THYAO");
    return NextResponse.json(idx);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}