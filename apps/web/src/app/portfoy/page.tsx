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

  // Monte Carlo
  const [mcSymbol, setMcSymbol] = useState("THYAO");
  const [mcDays, setMcDays] = useState(250);
  const [mcResult, setMcResult] = useState<any>(null);
  const [mcLoading, setMcLoading] = useState(false);

  // Markowitz
  const [mkSymbols, setMkSymbols] = useState("THYAO,GARAN,ASELS,KCHOL");
  const [mkResult, setMkResult] = useState<any>(null);
  const [mkLoading, setMkLoading] = useState(false);

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
    const histMap: Record<string, any[]> = {};
    for (const s of symbols) {
      try { histMap[s] = await j(`/api/history?symbol=${s}&range=1y&interval=1d`); } catch { histMap[s] = []; }
    }
    const minLen = Math.min(...Object.values(histMap).map((a) => a.length));
    if (minLen < 5) { setRiskResult({ error: "yetersiz veri" }); return; }
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

  async function runMonteCarlo() {
    setMcLoading(true); setMcResult(null);
    try {
      const hist = await j(`/api/history?symbol=${mcSymbol}&range=2y&interval=1d`);
      const prices = (hist || []).map((b: any) => b.close);
      const res = await j("/api/quant/monte-carlo", { method: "POST", body: JSON.stringify({ prices, days: mcDays, paths: 2000 }) });
      setMcResult(res);
    } catch (e: any) {
      setMcResult({ error: e?.message || String(e) });
    } finally {
      setMcLoading(false);
    }
  }

  async function runMarkowitz() {
    setMkLoading(true); setMkResult(null);
    try {
      const syms = mkSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const series: Record<string, number[]> = {};
      const histories: Record<string, any[]> = {};
      for (const s of syms) {
        const h = await j(`/api/history?symbol=${s}&range=2y&interval=1d`);
        histories[s] = h || [];
      }
      const minLen = Math.min(...Object.values(histories).map((a) => a.length));
      for (const s of syms) {
        series[s] = histories[s].slice(-minLen).map((b: any) => b.close);
      }
      const res = await j("/api/quant/markowitz", { method: "POST", body: JSON.stringify({ series, risk_free: 0 }) });
      setMkResult(res);
    } catch (e: any) {
      setMkResult({ error: e?.message || String(e) });
    } finally {
      setMkLoading(false);
    }
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

      {/* Monte Carlo */}
      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <h2 className="font-semibold">Monte Carlo Simülasyonu (GBM)</h2>
        <div className="flex flex-wrap gap-2">
          <input value={mcSymbol} onChange={(e) => setMcSymbol(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1" placeholder="Sembol" />
          <input type="number" value={mcDays} onChange={(e) => setMcDays(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-24" placeholder="Gün" />
          <button onClick={runMonteCarlo} disabled={mcLoading} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded text-sm disabled:opacity-50">
            {mcLoading ? "Hesaplanıyor…" : "Çalıştır"}
          </button>
        </div>
        {mcResult && !mcResult.error && (
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div>Güncel: {mcResult.current?.toFixed(2)}</div>
              <div>Ayı (5%): {mcResult.bear_5?.toFixed(2)}</div>
              <div>Baz (50%): {mcResult.base_50?.toFixed(2)}</div>
              <div>Boğa (95%): {mcResult.bull_95?.toFixed(2)}</div>
              <div>Beklenen: {mcResult.expected_terminal?.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <div>VaR %95: {mcResult.var95?.toFixed(2)}</div>
              <div>CVaR %95: {mcResult.cvar95?.toFixed(2)}</div>
              <div>Kâr Olasılığı: {(mcResult.prob_profit * 100)?.toFixed(1)}%</div>
              <div>Ort. Max DD: {(mcResult.avg_max_drawdown * 100)?.toFixed(1)}%</div>
              <div>Yıllık Getiri: {(mcResult.mu_annual * 100)?.toFixed(1)}% · Vol: {(mcResult.sigma_annual * 100)?.toFixed(1)}%</div>
            </div>
          </div>
        )}
        {mcResult?.error && <div className="text-rose-400 text-sm">{mcResult.error}</div>}
      </div>

      {/* Markowitz */}
      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <h2 className="font-semibold">Markowitz Portföy Optimizasyonu</h2>
        <div className="flex flex-wrap gap-2">
          <input value={mkSymbols} onChange={(e) => setMkSymbols(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-72" placeholder="Semboller (virgülle)" />
          <button onClick={runMarkowitz} disabled={mkLoading} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded text-sm disabled:opacity-50">
            {mkLoading ? "Hesaplanıyor…" : "Optimize Et"}
          </button>
        </div>
        {mkResult && !mkResult.error && (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">Max Sharpe</h3>
              <ul className="space-y-1">
                {Object.entries(mkResult.max_sharpe.weights).map(([k, v]: any) => (
                  <li key={k}>{k}: {(v * 100).toFixed(1)}%</li>
                ))}
              </ul>
              <div className="mt-2 text-zinc-400">
                Getiri: {(mkResult.max_sharpe.expected_return * 100).toFixed(1)}% · Vol: {(mkResult.max_sharpe.volatility * 100).toFixed(1)}% · Sharpe: {mkResult.max_sharpe.sharpe.toFixed(2)}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-1">Min Varyans</h3>
              <ul className="space-y-1">
                {Object.entries(mkResult.min_variance.weights).map(([k, v]: any) => (
                  <li key={k}>{k}: {(v * 100).toFixed(1)}%</li>
                ))}
              </ul>
              <div className="mt-2 text-zinc-400">
                Getiri: {(mkResult.min_variance.expected_return * 100).toFixed(1)}% · Vol: {(mkResult.min_variance.volatility * 100).toFixed(1)}% · Sharpe: {mkResult.min_variance.sharpe.toFixed(2)}
              </div>
            </div>
          </div>
        )}
        {mkResult?.error && <div className="text-rose-400 text-sm">{mkResult.error}</div>}
      </div>
    </div>
  );
}