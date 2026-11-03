"use client";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const thyao = useQuery({ queryKey: ["q", "THYAO"], queryFn: () => j("/api/quote?symbol=THYAO") });
  const garan = useQuery({ queryKey: ["q", "GARAN"], queryFn: () => j("/api/quote?symbol=GARAN") });
  const asels = useQuery({ queryKey: ["q", "ASELS"], queryFn: () => j("/api/quote?symbol=ASELS") });
  const usd = useQuery({ queryKey: ["fx", "USD", "TRY"], queryFn: () => j("/api/fx?from=USD&to=TRY") });
  const btc = useQuery({ queryKey: ["crypto", "bitcoin"], queryFn: () => j("/api/crypto?id=bitcoin&vs=usd") });
  const tcmb = useQuery({ queryKey: ["tcmb"], queryFn: () => j("/api/tcmb") });

  const usdTry = usd.data?.rate?.toFixed(2) ?? "—";
  const btcUsd = btc.data?.prices?.usd?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="THYAO" value={thyao.data ? thyao.data.price.toFixed(2) + " TRY" : "…"} sub={thyao.data ? `${thyao.data.changePercent?.toFixed(2)}%` : ""} />
        <Card title="GARAN" value={garan.data ? garan.data.price.toFixed(2) + " TRY" : "…"} sub={garan.data ? `${garan.data.changePercent?.toFixed(2)}%` : ""} />
        <Card title="ASELS" value={asels.data ? asels.data.price.toFixed(2) + " TRY" : "…"} sub={asels.data ? `${asels.data.changePercent?.toFixed(2)}%` : ""} />
        <Card title="USD/TRY" value={usdTry} />
        <Card title="Bitcoin (USD)" value={btcUsd} />
        <Card title="TCMB USD Alış" value={tcmb.data?.rates?.find((r: any) => r.code === "USD")?.buy?.toFixed(2) ?? "—"} />
      </div>
      <div className="text-sm text-zinc-500">
        Hisse detay için /hisse/[sembol] (örn. /hisse/THYAO). Veriler Yahoo Finance / CoinGecko / TCMB.
      </div>
    </div>
  );
}