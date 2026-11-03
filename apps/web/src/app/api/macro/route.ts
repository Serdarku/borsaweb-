import { NextResponse } from "next/server";
import { getMacroIndicators, getInflationData } from "@borsa/data";

export async function GET() {
  try {
    const [macro, infl] = await Promise.all([getMacroIndicators("TR"), getInflationData("TR")]);
    return NextResponse.json({ macro, inflation: infl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}