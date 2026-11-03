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

const GROUPS = [
  { v: "10004", label: "Tüm Bankalar" },
  { v: "10002", label: "Mevduat" },
  { v: "10003", label: "Katılım" },
  { v: "10006", label: "Kamu" },
  { v: "10005", label: "Yerli Özel" },
  { v: "10007", label: "Yabancı" },
];

export default function Bddk() {
  const [table, setTable] = useState(15);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(9);
  const [group, setGroup] = useState("10004");
  const [applied, setApplied] = useState({ table: 15, year: 2026, month: 9, group: "10004" });

  const q = useQuery({
    queryKey: ["bddk", applied],
    queryFn: () => j(`/api/bddk?table=${applied.table}&year=${applied.year}&month=${applied.month}&group=${applied.group}`),
  });

  const rows: any[][] = q.data?.rows || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">BDDK Bankacılık Sektörü</h1>
        <p className="text-sm text-zinc-500 mt-1">Aylık bülten tabloları — kaynak: bddk.org.tr</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-zinc-800/60">
          {TABLES.map((t) => (
            <button
              key={t.no}
              onClick={() => setTable(t.no)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${table === t.no ? "bg-emerald-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-wrap items-end gap-3 border-b border-zinc-800/60">
          <div>
            <label className="text-[11px] text-zinc-500">Grup</label>
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-1 block w-40 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              {GROUPS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Yıl</label>
            <Input type="number" value={year} onChange={(e: any) => setYear(+e.target.value)} className="mt-1 w-24" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Ay (1-12)</label>
            <Input type="number" value={month} onChange={(e: any) => setMonth(+e.target.value)} className="mt-1 w-20" />
          </div>
          <Button onClick={() => setApplied({ table, year, month, group })}>Getir</Button>
          <Badge variant="info">Bülten gecikmesi: ~2 ay</Badge>
        </div>

        {q.isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
        ) : rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Taraf</Th>
                <Th>Gösterge</Th>
                <Th className="text-right">Değer</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-zinc-800/20">
                  <Td className="text-zinc-400 whitespace-nowrap">{row[0]}</Td>
                  <Td className="text-zinc-200">{row[2]}</Td>
                  <Td className="text-right tabular-nums text-emerald-300">
                    {Number(row[4]) ? Number(row[4]).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : (row[4] ?? "—")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">
            {q.data?.error || "Bu dönem için veri yok. Önceki ayı deneyin (bülten ~2 ay gecikmeli yayımlanır)."}
          </div>
        )}
      </Card>
    </div>
  );
}