"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { Card, CardBody, Input, Button, Skeleton, Table, Th, Td, Badge } from "@/components/ui";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function Evds() {
  const [series, setSeries] = useState("TP.DK.USD.A.ZG");
  const [start, setStart] = useState("01-01-2025");
  const [end, setEnd] = useState("03-11-2026");
  const [applied, setApplied] = useState({ series, start, end });
  const q = useQuery({ queryKey: ["evds", applied], queryFn: () => j(`/api/evds?series=${applied.series}&start=${applied.start}&end=${applied.end}`) });

  const info: any[] = q.data?.items?.[0]?.observations || [];
  const missing = q.data?.error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">TCMB EVDS</h1>
        <p className="text-sm text-zinc-500 mt-1">EVDS API anahtarı ile makro seri çekimi</p>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-end gap-3 border-b border-zinc-800/60">
          <div>
            <label className="text-[11px] text-zinc-500">Seri Kodu</label>
            <Input value={series} onChange={(e: any) => setSeries(e.target.value)} className="mt-1 w-40" placeholder="TP.DK.USD.A.ZG" />
          </div>
          <div><label className="text-[11px] text-zinc-500">Başlangıç (GG-AA-YYYY)</label><Input value={start} onChange={(e: any) => setStart(e.target.value)} className="mt-1 w-32" /></div>
          <div><label className="text-[11px] text-zinc-500">Bitiş</label><Input value={end} onChange={(e: any) => setEnd(e.target.value)} className="mt-1 w-32" /></div>
          <Button onClick={() => setApplied({ series, start, end })}>Getir</Button>
        </div>

        <CardBody>
          {missing ? (
            <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm">
              <KeyRound size={16} className="text-amber-400 mt-0.5" />
              <div>
                <div className="font-medium text-amber-300">EVDS API anahtarı gerekiyor</div>
                <div className="text-amber-200/70 mt-1">
                  <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">.env</code> dosyasına <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">EVDS_API_KEY=...</code> ekleyin.
                  Anahtar: evds2.tcmb.gov.tr → "API Anahtarı Al" (ücretsiz).
                </div>
                <div className="mt-2 text-zinc-500 text-xs">Örnek seri kodları: TP.DK.USD.A.ZG (dolar kuru), TP.FGAR (politika faizi), TP.BIST48B (BIST100), TP.TUFE (enflasyon)</div>
              </div>
            </div>
          ) : q.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : info.length ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm">{q.data.items[0].series} <Badge variant="info">{q.data.items[0].unit}</Badge></div>
              <Table>
                <thead><tr><Th>Tarih</Th><Th className="text-right">Değer</Th></tr></thead>
                <tbody>
                  {info.slice(-30).reverse().map((o: any, i: number) => (
                    <tr key={i}><Td>{o.DATE}</Td><Td className="text-right tabular-nums">{o.OBS}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <div className="text-sm text-zinc-500">Gözlem yok — seri kodunu veya tarih aralığını kontrol edin.</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}