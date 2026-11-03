"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Play, LineChart as LineChartIcon, Gauge } from "lucide-react";
import { Card, CardBody, Badge, Button, Input, Skeleton, cn } from "@/components/ui";

interface Pos { id: string; symbol: string; quantity: number; cost: number; }
const STORAGE_KEY = "borsa.portfolio";

async function j(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function Pct({ v }: { v: number }) {
  return <span className={v >= 0 ? "text-emerald-400" : "text-rose-400"}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
}

export default function Portfoy() {
  const [positions, setPositions] = useState<Pos[]>([]);
  const [symbol, setSymbol] = useState("THYAO");
  const [qty, setQty] = useState(10);
  const [cost, setCost] = useState(0);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [stressResult, setStressResult] = useState<any>(null);
  const [mcSymbol, setMcSymbol] = useState("THYAO");
  const [mcDays, setMcDays] = useState(250);
  const [mcResult, setMcResult] = useState<any>(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [mkSymbols, setMkSymbols] = useState("THYAO,GARAN,ASELS,KCHOL");
  const [mkResult, setMkResult] = useState<any>(null);
  const [mkLoading, setMkLoading] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setPositions(JSON.parse(raw)); } catch {}
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); }, [positions]);

  const symbols = Array.from(new Set(positions.map((p) => p.symbol)));
  const quotes = useQuery({
    queryKey: ["quotes", symbols.join(",")],
    queryFn: async () => (symbols.length ? j(`/api/quotes?symbols=${symbols.join(",")}`) : []),
    enabled: symbols.length > 0,
  });
  const qmap: Record<string, any> = {};
  (quotes.data || []).forEach((q: any) => (qmap[q.symbol.split(".")[0]] = q));

  function add() {
    if (!symbol.trim()) return;
    setPositions((p) => [...p, { id: crypto.randomUUID(), symbol: symbol.toUpperCase(), quantity: qty, cost }]);
    setQty(10); setCost(0);
  }
  const remove = (id: string) => setPositions((p) => p.filter((x) => x.id !== id));

  let totalValue = 0, totalCost = 0;
  const weights: Record<string, number> = {};
  for (const p of positions) {
    const price = qmap[p.symbol]?.price ?? 0;
    const val = price * p.quantity;
    totalValue += val; totalCost += p.cost * p.quantity;
    weights[p.symbol] = (weights[p.symbol] || 0) + val;
  }
  const pl = totalValue - totalCost;
  const plPct = totalCost ? (pl / totalCost) * 100 : 0;

  async function analyzeRisk() {
    setRiskResult(null);
    if (!symbols.length) return setRiskResult({ error: "Önce pozisyon ekleyin" });
    const histMap: Record<string, any[]> = {};
    for (const s of symbols) { try { histMap[s] = await j(`/api/history?symbol=${s}&range=1y&interval=1d`); } catch { histMap[s] = []; } }
    const minLen = Math.min(...Object.values(histMap).map((a) => a.length));
    if (minLen < 5) return setRiskResult({ error: "Yetersiz veri" });
    const returnsBySymbol: Record<string, number[]> = {};
    for (const s of symbols) {
      const bars = histMap[s].slice(-minLen);
      returnsBySymbol[s] = bars.slice(1).map((b, i) => (b.close - bars[i].close) / bars[i].close);
    }
    const T = returnsBySymbol[symbols[0]].length;
    const portRets: number[] = [];
    for (let i = 0; i < T; i++) {
      let r = 0;
      for (const s of symbols) r += ((weights[s] || 0) / (totalValue || 1)) * (returnsBySymbol[s][i] || 0);
      portRets.push(r);
    }
    setRiskResult(await j("/api/quant/risk-metrics", { method: "POST", body: JSON.stringify({ returns: portRets }) }));
  }

  async function runStress() {
    setStressResult(null);
    if (!symbols.length) return setStressResult({ error: "Pozisyon yok" });
    const w: Record<string, number> = {};
    for (const k of Object.keys(weights)) w[k] = weights[k] / (totalValue || 1);
    setStressResult(await j("/api/quant/stress-test", { method: "POST", body: JSON.stringify({ weights: w, scenario: "bist_crash" }) }));
  }

  async function runMonteCarlo() {
    setMcLoading(true); setMcResult(null);
    try {
      const hist = await j(`/api/history?symbol=${mcSymbol}&range=2y&interval=1d`);
      const prices = (hist || []).map((b: any) => b.close);
      setMcResult(await j("/api/quant/monte-carlo", { method: "POST", body: JSON.stringify({ prices, days: mcDays, paths: 2000 }) }));
    } catch (e: any) { setMcResult({ error: e?.message }); }
    finally { setMcLoading(false); }
  }

  async function runMarkowitz() {
    setMkLoading(true); setMkResult(null);
    try {
      const syms = mkSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const histories: Record<string, any[]> = {};
      for (const s of syms) histories[s] = await j(`/api/history?symbol=${s}&range=2y&interval=1d`);
      const minLen = Math.min(...Object.values(histories).map((a) => a.length));
      const series: Record<string, number[]> = {};
      for (const s of syms) series[s] = histories[s].slice(-minLen).map((b: any) => b.close);
      setMkResult(await j("/api/quant/markowitz", { method: "POST", body: JSON.stringify({ series, risk_free: 0 }) }));
    } catch (e: any) { setMkResult({ error: e?.message }); }
    finally { setMkLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portföy</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={analyzeRisk}><Gauge size={14} className="mr-1.5" /> Risk</Button>
          <Button variant="secondary" onClick={runStress}>Stres Testi</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardBody><div className="text-xs text-zinc-500">Toplam Değer</div><div className="text-2xl font-semibold tabular-nums mt-1">₺{totalValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-zinc-500">Toplam Maliyet</div><div className="text-2xl font-semibold tabular-nums mt-1">₺{totalCost.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-zinc-500">Kâr / Zarar</div><div className={cn("text-2xl font-semibold tabular-nums mt-1", pl >= 0 ? "text-emerald-400" : "text-rose-400")}>₺{pl.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-zinc-500">Getiri</div><div className={cn("text-2xl font-semibold mt-1", pl >= 0 ? "text-emerald-400" : "text-rose-400")}><Pct v={plPct} /></div></CardBody></Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Pozisyonlar</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="text-left px-5 py-2 font-medium">Hisse</th>
                <th className="text-right px-5 py-2 font-medium">Adet</th>
                <th className="text-right px-5 py-2 font-medium">Maliyet</th>
                <th className="text-right px-5 py-2 font-medium">Fiyat</th>
                <th className="text-right px-5 py-2 font-medium">Değişim</th>
                <th className="text-right px-5 py-2 font-medium">Değer</th>
                <th className="text-right px-5 py-2 font-medium">K/Z</th>
                <th className="text-right px-5 py-2 font-medium">Ağırlık</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const q = qmap[p.symbol];
                const price = q?.price ?? 0;
                const val = price * p.quantity;
                const plp = val - p.cost * p.quantity;
                const w = totalValue ? (val / totalValue) * 100 : 0;
                return (
                  <tr key={p.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/20">
                    <td className="px-5 py-3 font-medium">{p.symbol}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{p.quantity}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{p.cost.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{price.toFixed(2) || "—"}</td>
                    <td className="px-5 py-3 text-right">{q?.changePercent != null ? <Pct v={q.changePercent} /> : "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{val.toFixed(0) || "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{<Pct v={p.cost ? (plp / (p.cost * p.quantity)) * 100 : 0} />}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(w, 100)}%` }} />
                        </div>
                        <span className="text-xs text-zinc-400 w-10 tabular-nums">{w.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => remove(p.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-zinc-500">Henüz pozisyon yok — aşağıdan ekleyin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-zinc-800/60 flex flex-wrap items-end gap-2">
          <div><label className="text-[11px] text-zinc-500">Sembol</label><Input value={symbol} onChange={(e: any) => setSymbol(e.target.value)} className="mt-1 w-28" /></div>
          <div><label className="text-[11px] text-zinc-500">Adet</label><Input type="number" value={qty} onChange={(e: any) => setQty(+e.target.value)} className="mt-1 w-24" /></div>
          <div><label className="text-[11px] text-zinc-500">Maliyet (₺)</label><Input type="number" value={cost} onChange={(e: any) => setCost(+e.target.value)} className="mt-1 w-28" /></div>
          <Button onClick={add}><Plus size={14} className="mr-1.5" /> Ekle</Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Monte Carlo Simülasyonu <Badge variant="info">GBM · 2.000 patika</Badge></h3></div>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div><label className="text-[11px] text-zinc-500">Sembol</label><Input value={mcSymbol} onChange={(e: any) => setMcSymbol(e.target.value)} className="mt-1 w-28" /></div>
              <div><label className="text-[11px] text-zinc-500">Gün</label><Input type="number" value={mcDays} onChange={(e: any) => setMcDays(+e.target.value)} className="mt-1 w-24" /></div>
              <Button onClick={runMonteCarlo} disabled={mcLoading}><Play size={14} className="mr-1.5" /> {mcLoading ? "Hesaplanıyor…" : "Çalıştır"}</Button>
            </div>
            {mcResult?.error && <div className="text-sm text-rose-400">{mcResult.error}</div>}
            {mcResult && !mcResult.error && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-3">
                  <div className="text-[11px] text-zinc-500 mb-1">Senaryolar</div>
                  <div className="flex justify-between"><span className="text-rose-400">Ayı (5%)</span><span className="tabular-nums">{mcResult.bear_5?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-300">Baz (50%)</span><span className="tabular-nums">{mcResult.base_50?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-400">Boğa (95%)</span><span className="tabular-nums">{mcResult.bull_95?.toFixed(2)}</span></div>
                </div>
                <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-3">
                  <div className="text-[11px] text-zinc-500 mb-1">Risk</div>
                  <div className="flex justify-between"><span>VaR %95</span><span className="tabular-nums">{mcResult.var95?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Kâr olasılığı</span><span className="tabular-nums">{(mcResult.prob_profit * 100)?.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Yıllık beklenen</span><span className="tabular-nums">{(mcResult.mu_annual * 100)?.toFixed(1)}%</span></div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Markowitz Optimizasyonu <Badge variant="info">10.000 portföy</Badge></h3></div>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1"><label className="text-[11px] text-zinc-500">Semboller (virgülle)</label><Input value={mkSymbols} onChange={(e: any) => setMkSymbols(e.target.value)} className="mt-1 w-full" /></div>
              <Button onClick={runMarkowitz} disabled={mkLoading}><LineChartIcon size={14} className="mr-1.5" /> {mkLoading ? "…" : "Optimize Et"}</Button>
            </div>
            {mkResult?.error && <div className="text-sm text-rose-400">{mkResult.error}</div>}
            {mkResult && !mkResult.error && (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-3">
                  <div className="text-[11px] text-zinc-500 mb-2">Maksimum Sharpe ağırlıkları</div>
                  <div className="space-y-1.5">
                    {Object.entries(mkResult.max_sharpe.weights as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-16 text-xs">{k}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${v * 100}%` }} /></div>
                          <span className="text-xs tabular-nums text-zinc-400 w-10 text-right">{(v * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-2">Getiri {(mkResult.max_sharpe.expected_return * 100).toFixed(1)}% · Vol {(mkResult.max_sharpe.volatility * 100).toFixed(1)}% · Sharpe {mkResult.max_sharpe.sharpe.toFixed(2)}</div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {(riskResult || stressResult) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {riskResult && !riskResult.error && (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Risk Metrikleri</h3></div>
              <CardBody className="grid grid-cols-2 gap-2">
                <Metric label="Sharpe" value={riskResult.sharpe?.toFixed(2)} />
                <Metric label="Sortino" value={riskResult.sortino?.toFixed(2)} />
                <Metric label="Maks. Düşüş" value={`%${(riskResult.max_drawdown * 100)?.toFixed(1)}`} />
                <Metric label="HHI" value={riskResult.hhi?.toFixed(3) ?? "—"} />
                <Metric label="Yıllık Getiri" value={`%${(riskResult.annualized_return * 100)?.toFixed(1)}`} />
                <Metric label="Yıllık Volatilite" value={`%${(riskResult.annualized_volatility * 100)?.toFixed(1)}`} />
              </CardBody>
            </Card>
          )}
          {stressResult && !stressResult.error && (
            <Card>
              <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Stres Testi — {stressResult.scenario}</h3></div>
              <CardBody>
                <div className={`text-2xl font-semibold ${stressResult.portfolio_impact >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {(stressResult.portfolio_impact * 100).toFixed(1)}% portföy etkisi
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Senaryo şokları: Hisse {stressResult.scenario_shocks.equity * 100}% · Kur +%{stressResult.scenario_shocks.fx * 100}% · Tahvil {stressResult.scenario_shocks.bond * 100}%
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 px-3 py-2">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-sm font-medium tabular-nums mt-0.5">{value ?? "—"}</div>
    </div>
  );
}