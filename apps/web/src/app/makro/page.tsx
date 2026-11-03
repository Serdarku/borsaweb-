"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, Badge, Skeleton, Table, Th, Td } from "@/components/ui";

async function j(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(await r.text()); return r.json(); }

const MAIN_CODES = ["USD", "EUR", "GBP"];

export default function Makro() {
  const m = useQuery({ queryKey: ["macro"], queryFn: () => j("/api/macro"), staleTime: 600000 });
  const t = useQuery({ queryKey: ["tcmb"], queryFn: () => j("/api/tcmb"), staleTime: 60000 });

  const rates: any[] = t.data?.rates || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Makroekonomi</h1>
        <p className="text-sm text-zinc-500 mt-1">TCMB kurları ve Dünya Bankası göstergeleri</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {MAIN_CODES.map((c) => {
          const r = rates.find((x) => x.code === c);
          return (
            <Card key={c}>
              <CardBody>
                <div className="text-xs text-zinc-500 flex items-center justify-between">{r?.name || c} <Badge variant="info">TCMB</Badge></div>
                {r ? (
                  <div className="flex items-end gap-4 mt-2">
                    <div><div className="text-[11px] text-zinc-500">Alış</div><div className="text-xl font-semibold tabular-nums">{r.buy.toFixed(4)}</div></div>
                    <div><div className="text-[11px] text-zinc-500">Satış</div><div className="text-xl font-semibold tabular-nums text-emerald-400">{r.sell.toFixed(4)}</div></div>
                  </div>
                ) : <Skeleton className="h-9 mt-2" />}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">TCMB Döviz Kurları — {t.data?.date}</h3></div>
          <Table>
            <thead><tr><Th>Kod</Th><Th>Cins</Th><Th className="text-right">Alış</Th><Th className="text-right">Satış</Th></tr></thead>
            <tbody>
              {rates.slice(0, 12).map((r: any) => (
                <tr key={r.code}>
                  <Td className="font-medium">{r.code}</Td>
                  <Td className="text-zinc-500">{r.name}</Td>
                  <Td className="text-right tabular-nums">{r.buy?.toFixed(4)}</Td>
                  <Td className="text-right tabular-nums text-emerald-400">{r.sell?.toFixed(4)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Dünya Bankası — Türkiye</h3></div>
          <CardBody className="space-y-4">
            {m.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            {(m.data?.macro?.indicators || []).map((ind: any) => (
              <div key={ind.code}>
                <div className="text-sm font-medium">{ind.name}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(ind.data || []).slice(0, 4).filter((d: any) => d.value != null).map((d: any) => (
                    <span key={d.date} className="rounded-md bg-zinc-800/50 border border-zinc-800/60 px-2 py-1 text-[11px] tabular-nums">
                      {d.date}: <b>{Number(d.value).toFixed(1)}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}