import { NextResponse } from "next/server";
import { getFearGreed } from "@borsa/data";

export async function GET() {
  try {
    const r = await getFearGreed();
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}