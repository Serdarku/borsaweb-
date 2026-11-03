"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, Badge, Input, Skeleton, Table, Th, Td } from "@/components/ui";
import LineChart from "@/components/LineChart";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Fonlar() {
  const [code, setCode] = useState("MAC");
  const [days, setDays] = useState(90);
  const fund = useQuery({ queryKey: ["tefasFund", code], queryFn: () => j(`/api/tefas/fund?code=${code}`), enabled: !!code });
  const hist = useQuery({ queryKey: ["tefasHist", code, days], queryFn: () => j(`/api/tefas/history?code=${code}&days=${days}`), enabled: !!code });

  const chartData = (hist.data || []).map((r: any) => ({ time: String(r.tarih || r.date).slice(0, 10), value: Number(r.fiyat ?? r.price) }));
  const last = chartData[chartData.length - 1]?.value;
  const first = chartData[0]?.value;
  const change = first ? ((last - first) / first) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TEFAS Fonları</h1>
          <p className="text-sm text-zinc-500 mt-1">Fon kodu ile fiyat geçmişi ve künye bilgisi</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={code} onChange={(e: any) => setCode(e.target.value.toUpperCase())} className="w-28" />
          <select value={days} onChange={(e) => setDays(+e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
            <option value={30}>1 ay</option>
            <option value={90}>3 ay</option>
            <option value={180}>6 ay</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center gap-3">
          <h3 className="text-sm font-semibold">{fund.data?.fonUnvan || code}</h3>
          {change != null && <Badge variant={change >= 0 ? "success" : "danger"}>{change >= 0 ? "+" : ""}{change.toFixed(1)}% dönem</Badge>}
        </div>
        <CardBody>
          {hist.isLoading ? <Skeleton className="h-72" /> : chartData.length > 1 ? <LineChart data={chartData} height={300} /> : <div className="text-sm text-zinc-500">Veri yok</div>}
        </CardBody>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Fiyat Geçmişi</h3></div>
        <Table>
          <thead><tr><Th>Tarih</Th><Th className="text-right">Fiyat (₺)</Th></tr></thead>
          <tbody>
            {(hist.data || []).slice(-15).reverse().map((r: any, i: number) => (
              <tr key={i}>
                <Td>{String(r.tarih || r.date).slice(0, 10)}</Td>
                <Td className="text-right tabular-nums">{Number(r.fiyat ?? r.price)?.toFixed(4)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}