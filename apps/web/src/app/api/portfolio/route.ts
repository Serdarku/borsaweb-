import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, hasDatabase } from "@/lib/prisma";

async function owner(): Promise<string> {
  const session = await auth();
  return session?.user?.name || process.env.AUTH_USERNAME || "default";
}

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil", positions: [] }, { status: 503 });
  }
  const o = await owner();
  const positions = await prisma.portfolioPosition.findMany({
    where: { owner: o },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ positions });
}

export async function POST(req: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  const quantity = Number(body?.quantity);
  const costBasis = Number(body?.costBasis ?? body?.cost ?? 0);
  const currency = String(body?.currency || "TRY");
  if (!symbol || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "symbol ve quantity gerekli" }, { status: 400 });
  }
  const o = await owner();
  const pos = await prisma.portfolioPosition.create({
    data: { owner: o, symbol, quantity, costBasis: Number.isFinite(costBasis) ? costBasis : 0, currency },
  });
  return NextResponse.json({ position: pos });
}

export async function PATCH(req: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const data: any = {};
  if (body?.quantity != null) data.quantity = Number(body.quantity);
  if (body?.costBasis != null || body?.cost != null) data.costBasis = Number(body.costBasis ?? body.cost);
  if (body?.symbol) data.symbol = String(body.symbol).toUpperCase();
  if (body?.currency) data.currency = String(body.currency);
  const o = await owner();
  const existing = await prisma.portfolioPosition.findFirst({ where: { id, owner: o } });
  if (!existing) return NextResponse.json({ error: "bulunamadi" }, { status: 404 });
  const pos = await prisma.portfolioPosition.update({ where: { id }, data });
  return NextResponse.json({ position: pos });
}

export async function DELETE(req: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil" }, { status: 503 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const o = await owner();
  const existing = await prisma.portfolioPosition.findFirst({ where: { id, owner: o } });
  if (!existing) return NextResponse.json({ error: "bulunamadi" }, { status: 404 });
  await prisma.portfolioPosition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
