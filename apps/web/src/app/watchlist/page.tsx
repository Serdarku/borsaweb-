"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Star } from "lucide-react";
import { Card, CardBody, Badge, Button, Input, Skeleton, cn } from "@/components/ui";

const STORAGE_KEY = "borsa.watchlist";

interface WlItem { id: string; symbol: string; }

async function loadWatchlist(): Promise<WlItem[]> {
  try {
    const r = await fetch("/api/watchlist");
    if (r.ok) {
      const d = await r.json();
      return (d.items || []).map((x: any) => ({ id: x.id, symbol: x.symbol }));
    }
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WlItem[]>([]);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    loadWatchlist().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const symbols = items.map((i) => i.symbol);
  const quotes = useQuery({
    queryKey: ["watchlist-quotes", symbols.join(",")],
    queryFn: async () => (symbols.length ? j(`/api/quotes?symbols=${symbols.join(",")}`) : []),
    enabled: symbols.length > 0,
  });
  const qmap: Record<string, any> = {};
  (quotes.data || []).forEach((q: any) => (qmap[q.symbol.split(".")[0]] = q));

  async function add() {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    try {
      const r = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (r.ok) {
        const d = await r.json();
        const it = d.item;
        setItems((prev) => prev.some((p) => p.symbol === it.symbol) ? prev : [...prev, { id: it.id, symbol: it.symbol }]);
        setSymbol("");
        return;
      }
    } catch {}
    if (!items.some((i) => i.symbol === sym)) {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), symbol: sym }]);
    }
    setSymbol("");
  }

  async function remove(id: string, sym: string) {
    try {
      const r = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, { method: "DELETE" });
      if (r.ok) { setItems((prev) => prev.filter((x) => x.id !== id)); return; }
    } catch {}
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Star size={20} className="text-amber-400" /> İzleme Listesi</h1>

      <Card>
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Takip edilen hisseler</h3>
          <Badge variant="info">{items.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="text-left px-5 py-2 font-medium">Hisse</th>
                <th className="text-right px-5 py-2 font-medium">Fiyat</th>
                <th className="text-right px-5 py-2 font-medium">Değişim</th>
                <th className="text-right px-5 py-2 font-medium">52H Aralık</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const q = qmap[it.symbol];
                return (
                  <tr key={it.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/20">
                    <td className="px-5 py-3 font-medium">{it.symbol}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{q?.price?.toFixed(2) ?? "—"}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${q?.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {q?.changePercent != null ? `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-zinc-500 tabular-nums">
                      {q?.fiftyTwoWeekLow ?? "—"} – {q?.fiftyTwoWeekHigh ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => remove(it.id, it.symbol)} className="text-zinc-600 hover:text-rose-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-500">Liste boş — aşağıdan hisse ekleyin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-zinc-800/60 flex items-end gap-2">
          <div className="flex-1"><label className="text-[11px] text-zinc-500">Sembol</label><Input value={symbol} onChange={(e: any) => setSymbol(e.target.value)} className="mt-1 w-full" placeholder="THYAO" /></div>
          <Button onClick={add}><Plus size={14} className="mr-1.5" /> Ekle</Button>
        </div>
      </Card>
    </div>
  );
}
