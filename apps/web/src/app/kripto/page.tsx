"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, Badge, Input, Skeleton } from "@/components/ui";
import LineChart from "@/components/LineChart";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

const PRESETS = [
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "solana", label: "SOL" },
];

export default function Kripto() {
  const [id, setId] = useState("bitcoin");
  const price = useQuery({ queryKey: ["cryptoPrice", id], queryFn: () => j(`/api/crypto?id=${id}&vs=usd`) });
  const hist = useQuery({ queryKey: ["cryptoHist", id], queryFn: () => j(`/api/crypto/history?id=${id}&days=90&vs=usd`) });
  const fng = useQuery({ queryKey: ["fng"], queryFn: () => j("/api/crypto/feargreed") });

  const chartData = (hist.data || []).map((r: any) => ({ time: r.date, value: r.price }));
  const f = fng.data?.data?.[0]?.value;
  const fngVariant = f == null ? "default" : f > 70 ? "success" : f < 30 ? "danger" : "info";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kripto</h1>
          <p className="text-sm text-zinc-500 mt-1">CoinGecko · 90 günlük fiyat geçmişi</p>
        </div>
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setId(p.id)} className={`px-3 py-1.5 rounded-lg text-xs ${id === p.id ? "bg-emerald-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>{p.label}</button>
          ))}
          <Input value={id} onChange={(e: any) => setId(e.target.value.toLowerCase())} className="w-32" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardBody>
            <div className="text-xs text-zinc-500">{id.toUpperCase()} / USD</div>
            {price.data ? <div className="text-2xl font-semibold tabular-nums mt-1">${price.data.prices?.usd?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div> : <Skeleton className="h-9 mt-1" />}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-zinc-500">Piyasa hissi</div>
            <div className="text-2xl font-semibold mt-1">{f ?? "—"} <span className="text-sm font-normal text-zinc-400">/ 100</span></div>
            <div className="mt-1"><Badge variant={fngVariant as any}>{fng.data?.data?.[0]?.value_classification}</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-zinc-500">30 günlük F&G</div>
            <div className="mt-2 h-8 flex gap-0.5">
              {(fng.data?.data || []).slice(0, 30).map((d: any, i: number) => (
                <div key={i} className="flex-1 rounded-sm" title={`${d.value} ${d.value_classification}`} style={{ height: "100%", background: d.value > 60 ? "#10b98155" : d.value < 30 ? "#f43f5e55" : "#a1a1aa33" }} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">{id.toUpperCase()} · Son 90 Gün</h3></div>
        <CardBody>
          {hist.isLoading ? <Skeleton className="h-72" /> : chartData.length > 1 ? <LineChart data={chartData} height={300} color="#38bdf8" /> : <div className="text-sm text-zinc-500">Veri yok</div>}
        </CardBody>
      </Card>
    </div>
  );
}