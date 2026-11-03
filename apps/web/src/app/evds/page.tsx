"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Evds() {
  const [series, setSeries] = useState("TP.DK.USD.A");
  const [start, setStart] = useState("01-01-2024");
  const [end, setEnd] = useState("31-12-2025");
  const q = useQuery({ queryKey: ["evds", series, start, end], queryFn: () => j(`/api/evds?series=${series}&start=${start}&end=${end}`) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">TCMB EVDS</h1>
      <div className="text-xs text-zinc-500">EVDS_API_KEY gerekir (.env). Örnek seri: TP.DK.USD.A</div>
      <div className="flex flex-wrap gap-2">
        <input value={series} onChange={(e) => setSeries(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-40" />
        <input value={start} onChange={(e) => setStart(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-28" />
        <input value={end} onChange={(e) => setEnd(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-28" />
      </div>
      {q.data?.error && <div className="text-rose-400 text-sm">{q.data.error}</div>}
      <pre className="rounded border border-zinc-800 p-4 text-xs text-zinc-300 overflow-auto max-h-96">
        {q.data ? JSON.stringify(q.data, null, 2).slice(0, 4000) : "Yükleniyor…"}
      </pre>
    </div>
  );
}