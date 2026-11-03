import { NextRequest, NextResponse } from "next/server";
import { monteCarlo, markowitz, riskMetrics, stressTest, backtest, SCENARIOS } from "@/lib/quant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = any;

const POST_ROUTES: Record<string, (b: Body) => unknown> = {
  "monte-carlo": (b) => monteCarlo(b),
  markowitz: (b) => markowitz(b),
  "risk-metrics": (b) => riskMetrics(b),
  "stress-test": (b) => stressTest(b),
  backtest: (b) => backtest(b),
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  if (slug[0] === "scenarios") return NextResponse.json(SCENARIOS);
  return NextResponse.json({ status: "ok", service: "quant-ts", endpoints: Object.keys(POST_ROUTES) });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  const name = slug.join("/");
  const fn = POST_ROUTES[name];
  if (!fn) return NextResponse.json({ error: `bilinmeyen quant ucu: ${name}` }, { status: 404 });
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "geçersiz JSON gövdesi" }, { status: 400 });
  }
  try {
    return NextResponse.json(fn(body) ?? null);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 400 });
  }
}