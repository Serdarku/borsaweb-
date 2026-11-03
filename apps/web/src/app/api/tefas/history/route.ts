import { NextRequest, NextResponse } from "next/server";
import { getTefasHistory } from "@borsa/data";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const days = +(req.nextUrl.searchParams.get("days") || "90");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  try {
    const h = await getTefasHistory(code, days);
    return NextResponse.json(h);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}