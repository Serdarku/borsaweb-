"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Input, Button, Skeleton, Table, Th, Td } from "@/components/ui";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

const TABLES = [
  { no: 1, name: "Bilanço" },
  { no: 2, name: "Kar Zarar" },
  { no: 3, name: "Krediler" },
  { no: 9, name: "Mevduat" },
  { no: 12, name: "Sermaye Yeterliliği" },
  { no: 15, name: "Rasyolar" },
];

export default function Bddk() {
  const [table, setTable] = useState(15);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() || 12);
  const [applied, setApplied] = useState({ table: 15, year: new Date().getFullYear(), month: new Date().getMonth() || 12 });
  const q = useQuery({ queryKey: ["bddk", applied], queryFn: () => j(`/api/bddk?table=${applied.table}&year=${applied.year}&month=${applied.month}`) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">BDDK Bankacılık Sektörü</h1>
        <p className="text-sm text-zinc-500 mt-1">Aylık bülten tabloları — kaynak: bddk.org.tr</p>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-end gap-3 border-b border-zinc-800/60">
          <div className="flex gap-1.5 flex-wrap">
            {TABLES.map((t) => (
              <button key={t.no} onClick={() => setTable(t.no)} className={`px-2.5 py-1.5 rounded-lg text-xs ${table === t.no ? "bg-emerald-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>{t.name}</button>
            ))}
          </div>
          <Input type="number" value={year} onChange={(e: any) => setYear(+e.target.value)} className="w-24" />
          <Input type="number" value={month} onChange={(e: any) => setMonth(+e.target.value)} className="w-20" />
          <Button onClick={() => setApplied({ table, year, month })}>Getir</Button>
        </div>
        {q.isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
        ) : q.data?.rows?.length ? (
          <Table>
            <thead><tr><Th>Taraf</Th><Th>Göstergeler</Th><Th className="text-right">Değer</Th></tr></thead>
            <tbody>
              {q.data.rows.slice(0, 80).map((row: any[], i: number) => (
                <tr key={i} className="hover:bg-zinc-800/20">
                  <Td className="text-zinc-400">{row[0]}</Td>
                  <Td>{row[2]}</Td>
                  <Td className="text-right tabular-nums">{Number(row[4]) ? Number(row[4]).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : row[4]}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">{q.data?.error || "Bu dönem için veri bulunamadı (bülten gecikmesi olabilir)."} <Badge variant="info">Deneyin: önceki ay</Badge></div>
        )}
      </Card>
    </div>
  );
}