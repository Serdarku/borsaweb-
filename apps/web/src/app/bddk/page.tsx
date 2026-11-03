"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Bddk() {
  const [table, setTable] = useState(15);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() || 12);
  const q = useQuery({ queryKey: ["bddk", table, year, month], queryFn: () => j(`/api/bddk?table=${table}&year=${year}&month=${month}`) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">BDDK Bankacılık Sektörü</h1>
      <div className="flex flex-wrap gap-2">
        <input type="number" value={table} onChange={(e) => setTable(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20" placeholder="Tablo" />
        <input type="number" value={year} onChange={(e) => setYear(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-24" />
        <input type="number" value={month} onChange={(e) => setMonth(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20" />
      </div>
      {q.data?.rows && Array.isArray(q.data.rows) && q.data.rows.length > 0 ? (
        <div className="rounded border border-zinc-800 p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              {q.data.rows.slice(0, 60).map((row: any, i: number) => (
                <tr key={i} className="border-t border-zinc-800">
                  {Array.isArray(row) ? row.map((c: any, j: number) => (
                    <td key={j} className="py-1 pr-3 text-zinc-300">{String(c)}</td>
                  )) : <td>{JSON.stringify(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-zinc-500 mt-2">Toplam {q.data.rows.length} satır</div>
        </div>
      ) : (
        <div className="text-zinc-500">{q.isLoading ? "Yükleniyor…" : "Veri yok veya hata"}</div>
      )}
      {q.data?.error && <div className="text-rose-400 text-sm">{q.data.error}</div>}
    </div>
  );
}