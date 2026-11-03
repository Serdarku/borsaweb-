import { NextResponse } from "next/server";
import { fetchBddkTable, getBddkRatios } from "@borsa/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const table = +(url.searchParams.get("table") || "15");
  const year = +(url.searchParams.get("year") || new Date().getFullYear());
  const month = +(url.searchParams.get("month") || (new Date().getMonth() || 12));
  try {
    const r = table === 15 && !url.searchParams.get("year")
      ? await getBddkRatios()
      : await fetchBddkTable(table, year, month);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}