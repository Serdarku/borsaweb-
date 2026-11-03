"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function Fonlar() {
  const [code, setCode] = useState("MAC");
  const [days, setDays] = useState(90);
  const fund = useQuery({ queryKey: ["tefasFund", code], queryFn: () => j(`/api/tefas/fund?code=${code}`) });
  const hist = useQuery({ queryKey: ["tefasHist", code, days], queryFn: () => j(`/api/tefas/history?code=${code}&days=${days}`) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">TEFAS Fonlar</h1>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1" />
        <select value={days} onChange={(e) => setDays(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
          <option value={30}>30g</option>
          <option value={90}>90g</option>
          <option value={180}>180g</option>
        </select>
      </div>
      {fund.data && !fund.data.error && (
        <div className="rounded border border-zinc-800 p-4 text-sm">
          <div className="font-semibold">{fund.data.fonUnvan || fund.data.FONUNVAN || code}</div>
          <div className="text-zinc-400 text-xs mt-1">Kod: {code}</div>
        </div>
      )}
      {hist.data && Array.isArray(hist.data) && hist.data.length > 0 && (
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400 mb-2">Son {hist.data.length} fiyat kaydı</div>
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-400"><th className="text-left">Tarih</th><th>Fiyat</th></tr></thead>
            <tbody>
              {hist.data.slice(-15).map((r: any, i: number) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td>{r.tarih || r.TARIH || r.date}</td>
                  <td className="text-right">{(r.fiyat || r.FIYAT || r.price)?.toFixed?.(4) ?? r.fiyat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}