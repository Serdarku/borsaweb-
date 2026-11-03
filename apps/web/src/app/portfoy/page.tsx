"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Pos { id: string; symbol: string; quantity: number; cost: number; }

const STORAGE_KEY = "borsa.portfolio";

async function j(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function Portfoy() {
  const [positions, setPositions] = useState<Pos[]>([]);
  const [symbol, setSymbol] = useState("THYAO");
  const [qty, setQty] = useState(10);
  const [cost, setCost] = useState(0);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [stressResult, setStressResult] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPositions(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  const symbols = Array.from(new Set(positions.map((p) => p.symbol)));
  const quotes = useQuery({
    queryKey: ["quotes", symbols.join(",")],
    queryFn: async () => {
      const out: Record<string, any> = {};
      for (const s of symbols) {
        try { out[s] = await j(`/api/quote?symbol=${s}`); } catch { out[s] = null; }
      }
      return out;
    },
    enabled: symbols.length > 0,
  });

  function add() {
    setPositions((p) => [...p, { id: crypto.randomUUID(), symbol: symbol.toUpperCase(), quantity: qty, cost }]);
    setQty(10); setCost(0);
  }
  function remove(id: string) {
    setPositions((p) => p.filter((x) => x.id !== id));
  }

  const qdata = quotes.data || {};
  let totalValue = 0;
  let totalCost = 0;
  const weights: Record<string, number> = {};
  for (const p of positions) {
    const q = qdata[p.symbol];
    const price = q?.price ?? 0;
    const val = price * p.quantity;
    totalValue += val;
    totalCost += p.cost * p.quantity;
    weights[p.symbol] = (weights[p.symbol] || 0) + val;
  }
  for (const k of Object.keys(weights)) weights[k] = totalValue ? weights[k] / totalValue : 0;

  async function analyzeRisk() {
    setRiskResult(null);
    // fetch histories and compute portfolio returns
    const histMap: Record<string, any[]> = {};
    for (const s of symbols) {
      try { histMap[s] = await j(`/api/history?symbol=${s}&range=1y&interval=1d`); } catch { histMap[s] = []; }
    }
    // align lengths
    const minLen = Math.min(...Object.values(histMap).map((a) => a.length));
    if (minLen < 5) { setRiskResult({ error: "yetersiz veri" }); return; }
    // compute returns per symbol
    const returnsBySymbol: Record<string, number[]> = {};
    for (const s of symbols) {
      const bars = histMap[s].slice(-minLen);
      const r: number[] = [];
      for (let i = 1; i < bars.length; i++) r.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close);
      returnsBySymbol[s] = r;
    }
    const T = returnsBySymbol[symbols[0]].length;
    const portRets: number[] = [];
    for (let i = 0; i < T; i++) {
      let r = 0;
      for (const s of symbols) r += (weights[s] || 0) * (returnsBySymbol[s][i] || 0);
      portRets.push(r);
    }
    const res = await j("/api/quant/risk-metrics", { method: "POST", body: JSON.stringify({ returns: portRets }) });
    setRiskResult(res);
  }

  async function runStress() {
    setStressResult(null);
    const res = await j("/api/quant/stress-test", { method: "POST", body: JSON.stringify({ weights, scenario: "bist_crash" }) });
    setStressResult(res);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portföy</h1>

      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <h2 className="font-semibold">Pozisyon Ekle</h2>
        <div className="flex flex-wrap gap-2">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1" placeholder="Sembol" />
          <input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-24" placeholder="Adet" />
          <input type="number" value={cost} onChange={(e) => setCost(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-28" placeholder="Maliyet" />
          <button onClick={add} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded">Ekle</button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 p-4">
        <h2 className="font-semibold mb-2">Pozisyonlar</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-zinc-400"><th className="text-left">Sembol</th><th>Adet</th><th>Maliyet</th><th>Fiyat</th><th>Değer</th><th>K/Z</th><th></th></tr></thead>
          <tbody>
            {positions.map((p) => {
              const q = qdata[p.symbol];
              const price = q?.price ?? 0;
              const val = price * p.quantity;
              const pl = val - p.cost * p.quantity;
              return (
                <tr key={p.id} className="border-t border-zinc-800">
                  <td className="py-1">{p.symbol}</td>
                  <td className="text-center">{p.quantity}</td>
                  <td className="text-center">{p.cost.toFixed(2)}</td>
                  <td className="text-center">{price.toFixed(2)}</td>
                  <td className="text-center">{val.toFixed(2)}</td>
                  <td className={`text-center ${pl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pl.toFixed(2)}</td>
                  <td className="text-center"><button onClick={() => remove(p.id)} className="text-rose-400 text-xs">sil</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-3 text-sm text-zinc-300">
          Toplam Değer: {totalValue.toFixed(2)} · Toplam Maliyet: {totalCost.toFixed(2)} · K/Z: <span className={totalValue - totalCost >= 0 ? "text-emerald-400" : "text-rose-400"}>{(totalValue - totalCost).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={analyzeRisk} className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm">Risk Metrikleri (Sharpe/Sortino/MaxDD/HHI)</button>
        <button onClick={runStress} className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm">Stres Testi (BIST çöküşü)</button>
      </div>

      {riskResult && (
        <div className="rounded-lg border border-zinc-800 p-4 text-sm">
          <h2 className="font-semibold mb-2">Risk Metrikleri</h2>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{JSON.stringify(riskResult, null, 2)}</pre>
        </div>
      )}
      {stressResult && (
        <div className="rounded-lg border border-zinc-800 p-4 text-sm">
          <h2 className="font-semibold mb-2">Stres Testi</h2>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{JSON.stringify(stressResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}