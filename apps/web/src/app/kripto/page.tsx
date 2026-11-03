"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Kripto() {
  const [id, setId] = useState("bitcoin");
  const price = useQuery({ queryKey: ["cryptoPrice", id], queryFn: () => j(`/api/crypto?id=${id}&vs=usd`) });
  const hist = useQuery({ queryKey: ["cryptoHist", id], queryFn: () => j(`/api/crypto/history?id=${id}&days=90&vs=usd`) });
  const fng = useQuery({ queryKey: ["fng"], queryFn: () => j("/api/crypto/feargreed") });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kripto</h1>
      <div className="flex gap-2">
        <input value={id} onChange={(e) => setId(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border border-zinc-800 p-4">
          <h2 className="font-semibold mb-2">Fiyat (USD)</h2>
          {price.data ? (
            <div className="text-2xl">{price.data.prices?.usd?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
          ) : <div className="text-zinc-500">Yükleniyor…</div>}
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <h2 className="font-semibold mb-2">Fear & Greed</h2>
          {fng.data?.data?.[0] ? (
            <div>
              <div className="text-2xl">{fng.data.data[0].value}</div>
              <div className="text-sm text-zinc-400">{fng.data.data[0].value_classification}</div>
            </div>
          ) : <div className="text-zinc-500">Yükleniyor…</div>}
        </div>
      </div>
      {hist.data && Array.isArray(hist.data) && (
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-2">Son {hist.data.length} gün</div>
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-400"><th className="text-left">Tarih</th><th>Fiyat</th></tr></thead>
            <tbody>
              {hist.data.slice(-10).map((r: any, i: number) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td>{r.date}</td><td className="text-right">{r.price?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}