import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, hasDatabase } from "@/lib/prisma";

async function owner(): Promise<string> {
  const session = await auth();
  return session?.user?.name || process.env.AUTH_USERNAME || "default";
}

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil", items: [] }, { status: 503 });
  }
  const o = await owner();
  const items = await prisma.watchlistItem.findMany({
    where: { owner: o },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol gerekli" }, { status: 400 });
  const o = await owner();
  try {
    const item = await prisma.watchlistItem.create({ data: { owner: o, symbol } });
    return NextResponse.json({ item });
  } catch (e: any) {
    // unique constraint -> already exists
    const existing = await prisma.watchlistItem.findUnique({ where: { owner_symbol: { owner: o, symbol } } });
    return NextResponse.json({ item: existing });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL tanimli degil" }, { status: 503 });
  }
  const symbol = req.nextUrl.searchParams.get("symbol");
  const id = req.nextUrl.searchParams.get("id");
  const o = await owner();
  if (id) {
    const existing = await prisma.watchlistItem.findFirst({ where: { id, owner: o } });
    if (!existing) return NextResponse.json({ error: "bulunamadi" }, { status: 404 });
    await prisma.watchlistItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  if (symbol) {
    const existing = await prisma.watchlistItem.findUnique({ where: { owner_symbol: { owner: o, symbol: symbol.toUpperCase() } } });
    if (!existing) return NextResponse.json({ error: "bulunamadi" }, { status: 404 });
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "id veya symbol gerekli" }, { status: 400 });
}
