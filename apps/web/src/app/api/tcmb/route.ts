import { NextResponse } from "next/server";
import { getTcmbRates } from "@borsa/data";

export async function GET() {
  try {
    const t = await getTcmbRates();
    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}