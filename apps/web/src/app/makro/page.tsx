"use client";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Makro() {
  const m = useQuery({ queryKey: ["macro"], queryFn: () => j("/api/macro") });
  const t = useQuery({ queryKey: ["tcmb"], queryFn: () => j("/api/tcmb") });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Makro & TCMB</h1>
      <div className="rounded border border-zinc-800 p-4">
        <h2 className="font-semibold mb-2">TCMB Kurlar</h2>
        {t.data?.rates ? (
          <table className="w-full text-sm">
            <thead><tr className="text-zinc-400"><th className="text-left">Kod</th><th>Ad</th><th>Alış</th><th>Satış</th></tr></thead>
            <tbody>
              {t.data.rates.slice(0, 12).map((r: any) => (
                <tr key={r.code} className="border-t border-zinc-800">
                  <td>{r.code}</td><td className="text-zinc-400">{r.name}</td>
                  <td className="text-right">{r.buy?.toFixed(4)}</td>
                  <td className="text-right">{r.sell?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-zinc-500">Yükleniyor…</div>}
      </div>
      <div className="rounded border border-zinc-800 p-4">
        <h2 className="font-semibold mb-2">Dünya Bankası Göstergeleri (TR)</h2>
        {m.data?.macro?.indicators ? (
          <div className="space-y-3">
            {m.data.macro.indicators.map((ind: any) => (
              <div key={ind.code}>
                <div className="text-sm font-medium">{ind.name}</div>
                <div className="text-xs text-zinc-400">
                  {ind.data?.slice(0, 5).map((d: any) => `${d.date}: ${d.value?.toFixed?.(2) ?? d.value}`).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-zinc-500">Yükleniyor…</div>}
      </div>
    </div>
  );
}