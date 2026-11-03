import { NextResponse } from "next/server";
import { fetchBddkTable } from "@borsa/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const table = +(url.searchParams.get("table") || "15");
  const year = +(url.searchParams.get("year") || new Date().getFullYear());
  const month = +(url.searchParams.get("month") || (new Date().getMonth() || 12));
  const group = url.searchParams.get("group") || "10004";
  const currency = url.searchParams.get("currency") || "TL";
  try {
    const r = await fetchBddkTable(table, year, month, currency, group);
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}