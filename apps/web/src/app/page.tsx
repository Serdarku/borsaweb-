"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, Banknote, Bitcoin, Gem, Landmark } from "lucide-react";
import { Card, CardBody, Stat, Badge, Skeleton } from "@/components/ui";

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const POPULAR = ["THYAO", "GARAN", "ASELS", "EREGL", "KCHOL", "TUPRS", "AKBNK", "SAHOL"];

export default function Dashboard() {
  const popular = useQuery({ queryKey: ["popular", POPULAR.join(",")], queryFn: () => j(`/api/quotes?symbols=${POPULAR.join(",")}`) });
  const xu100 = useQuery({ queryKey: ["idx"], queryFn: () => j("/api/index") });
  const usd = useQuery({ queryKey: ["fx", "USD"], queryFn: () => j("/api/fx?from=USD&to=TRY") });
  const eur = useQuery({ queryKey: ["fx", "EUR"], queryFn: () => j("/api/fx?from=EUR&to=TRY") });
  const btc = useQuery({ queryKey: ["crypto", "bitcoin"], queryFn: () => j("/api/crypto?id=bitcoin&vs=usd") });
  const eth = useQuery({ queryKey: ["crypto", "ethereum"], queryFn: () => j("/api/crypto?id=ethereum&vs=usd") });

  const loading = popular.isLoading || xu100.isLoading;

  const changeClass = (v?: number) => (v == null ? "text-zinc-400" : v >= 0 ? "text-emerald-400" : "text-rose-400");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Piyasa Özeti</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat
              icon={<Activity size={18} />}
              label="BIST 100"
              value={xu100.data?.price?.toLocaleString?.("tr-TR", { maximumFractionDigits: 2 }) ?? "—"}
              change={xu100.data?.changePercent != null ? `${xu100.data.changePercent.toFixed(2)}%` : undefined}
            />
            <Stat icon={<Landmark size={18} />} label="USD / TRY" value={usd.data?.rate?.toFixed(2) ?? "—"} />
            <Stat icon={<Landmark size={18} />} label="EUR / TRY" value={eur.data?.rate?.toFixed(2) ?? "—"} />
            <Stat icon={<Bitcoin size={18} />} label="Bitcoin" value={`$${btc.data?.prices?.usd?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}`} />
            <Stat icon={<Gem size={18} />} label="Ethereum" value={`$${eth.data?.prices?.usd?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}`} />
            <Stat icon={<Banknote size={18} />} label="BIST 52H" value={xu100.data?.fiftyTwoWeekLow ? `${Math.round(xu100.data.fiftyTwoWeekLow)}–${Math.round(xu100.data.fiftyTwoWeekHigh)}` : "—"} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
            <h3 className="text-sm font-semibold">Çok İzlenen BIST Hisseleri</h3>
            <Badge variant="info">Canlı</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="text-left px-5 py-2 font-medium">Hisse</th>
                  <th className="text-right px-5 py-2 font-medium">Fiyat</th>
                  <th className="text-right px-5 py-2 font-medium">Değişim</th>
                  <th className="text-right px-5 py-2 font-medium hidden sm:table-cell">Hacim</th>
                  <th className="text-right px-5 py-2 font-medium hidden md:table-cell">52H Aralık</th>
                </tr>
              </thead>
              <tbody>
                {(popular.data || []).map((q: any) => (
                  <tr key={q.symbol} className="border-t border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/hisse/${q.symbol.split(".")[0]}`} className="font-medium text-emerald-400 hover:underline">
                        {q.symbol.split(".")[0]}
                      </Link>
                      <div className="text-xs text-zinc-500 max-w-[180px] truncate">{q.name}</div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{q.price?.toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${changeClass(q.changePercent)}`}>
                      {q.changePercent >= 0 ? "+" : ""}{q.changePercent?.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums hidden sm:table-cell text-zinc-400">{q.volume?.toLocaleString("tr-TR")}</td>
                    <td className="px-5 py-3 text-right text-xs text-zinc-500 tabular-nums hidden md:table-cell">
                      {q.fiftyTwoWeekLow} – {q.fiftyTwoWeekHigh}
                    </td>
                  </tr>
                ))}
                {popular.isLoading && Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <h3 className="text-sm font-semibold">Hızlı Erişim</h3>
          </div>
          <CardBody className="space-y-2">
            {[
              { href: "/hisse/THYAO", label: "THYAO analizi", desc: "Grafik + temel veriler" },
              { href: "/portfoy", label: "Portföyüm", desc: "Monte Carlo · Markowitz" },
              { href: "/chat", label: "AI Asistan", desc: "Piyasa sorularını sorun" },
              { href: "/fonlar", label: "TEFAS Fonları", desc: "Fon fiyat ve getiriler" },
              { href: "/kripto", label: "Kripto", desc: "BTC/ETH + korku-açgözlülük" },
              { href: "/bddk", label: "BDDK", desc: "Bankacılık sektörü" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-lg border border-zinc-800/60 px-3.5 py-2.5 hover:border-emerald-500/40 hover:bg-zinc-800/40 transition-colors">
                <div>
                  <div className="text-sm">{l.label}</div>
                  <div className="text-xs text-zinc-500">{l.desc}</div>
                </div>
                <span className="text-zinc-600">→</span>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}