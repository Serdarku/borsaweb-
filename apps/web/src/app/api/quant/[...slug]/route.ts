import { NextRequest, NextResponse } from "next/server";

const QUANT = process.env.QUANT_URL || process.env.NEXT_PUBLIC_QUANT_URL || "http://localhost:8000";

async function handler(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  const path = "/" + slug.join("/");
  const url = `${QUANT}${path}`;
  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const res = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;