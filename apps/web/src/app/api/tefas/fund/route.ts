import { NextRequest, NextResponse } from "next/server";
import { getTefasFund } from "@borsa/data";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  try {
    const f = await getTefasFund(code);
    return NextResponse.json(f);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}