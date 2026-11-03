"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { Card, CardBody, Badge, Skeleton } from "@/components/ui";
import { rsi, sma, changePct } from "@/components/indicators";

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 px-3 py-2">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-sm font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

export default function HisseDetay() {
  const params = useParams();
  const symbol = (params?.symbol as string) || "THYAO";
  const [range, setRange] = useState("6mo");
  const [tab, setTab] = useState<"ozet" | "teknik" | "haberler">("ozet");

  const quote = useQuery({ queryKey: ["q", symbol], queryFn: () => j(`/api/quote?symbol=${symbol}`) });
  const fund = useQuery({ queryKey: ["fund", symbol], queryFn: () => j(`/api/fundamentals?symbol=${symbol}`) });
  const hist = useQuery({ queryKey: ["hist", symbol, range], queryFn: () => j(`/api/history?symbol=${symbol}&range=${range}`) });
  const news = useQuery({ queryKey: ["news", symbol], queryFn: () => j(`/api/news?symbol=${symbol}`) });

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !hist.data || !Array.isArray(hist.data) || !hist.data.length) return;
    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#a1a1aa" },
      width: chartRef.current.clientWidth,
      height: 380,
      grid: { vertLines: { color: "#18181b" }, horzLines: { color: "#18181b" } },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a" },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f43f5e",
    });
    series.setData(hist.data.map((b: any) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close })));
    chart.timeScale().fitContent();
    const onResize = () => chartRef.current && chart.applyOptions({ width: chartRef.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [hist.data]);

  const closes: number[] = (hist.data || []).map((b: any) => b.close);
  const r14 = rsi(closes);
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const chg1m = changePct(closes, 21);
  const chg3m = changePct(closes, 63);

  const q = quote.data;
  const up = (q?.changePercent ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{symbol}</h1>
              {q && <Badge variant={up ? "success" : "danger"}>{up ? "▲" : "▼"} {Math.abs(q.changePercent ?? 0).toFixed(2)}%</Badge>}
            </div>
            <div className="text-sm text-zinc-500 mt-1">{q?.name || "…"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Son Fiyat</div>
            {q ? (
              <div className="text-3xl font-semibold tabular-nums">
                {q.price?.toFixed(2)} <span className="text-base text-zinc-400">{q.currency}</span>
              </div>
            ) : <Skeleton className="h-9 w-32" />}
          </div>
          <div className="ml-auto grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Metric label="Gün Aralığı" value={q ? `${q.dayLow} – ${q.dayHigh}` : "—"} />
            <Metric label="52 Hafta" value={q ? `${q.fiftyTwoWeekLow} – ${q.fiftyTwoWeekHigh}` : "—"} />
            <Metric label="Hacim" value={q?.volume ? q.volume.toLocaleString("tr-TR") : "—"} />
            <Metric label="Piyasa Değeri" value={q?.marketCap ? (q.marketCap / 1e9).toFixed(1) + " Mr" : "—"} />
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {["1mo", "3mo", "6mo", "1y", "2y"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${range === r ? "bg-emerald-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}
          >
            {r}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {(["ozet", "teknik", "haberler"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
            >
              {t === "ozet" ? "Özet" : t === "teknik" ? "Teknik" : "Haberler"}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardBody>
          {hist.isLoading ? <Skeleton className="h-[380px]" /> : <div ref={chartRef} className="w-full" />}
        </CardBody>
      </Card>

      {tab === "ozet" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Temel Veriler</h3></div>
            <CardBody className="grid grid-cols-2 gap-2">
              {fund.data ? (
                <>
                  <Metric label="F/K" value={fund.data.pe?.toFixed(2) ?? "—"} />
                  <Metric label="PD/DD" value={fund.data.pb?.toFixed(2) ?? "—"} />
                  <Metric label="EPS" value={fund.data.eps?.toFixed(2) ?? "—"} />
                  <Metric label="Beta" value={fund.data.beta?.toFixed(2) ?? "—"} />
                  <Metric label="Temettü Verimi" value={fund.data.dividendYield != null ? `${(fund.data.dividendYield * 100).toFixed(2)}%` : "—"} />
                  <Metric label="ROE" value={fund.data.roe != null ? `${(fund.data.roe * 100).toFixed(1)}%` : "—"} />
                  <Metric label="Sektör" value={fund.data.sector ?? "—"} />
                  <Metric label="Sanayi" value={fund.data.industry ?? "—"} />
                </>
              ) : Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </CardBody>
          </Card>
          <Card>
            <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Hızlı Bakış</h3></div>
            <CardBody className="grid grid-cols-2 gap-2">
              <Metric label="RSI (14)" value={r14 != null ? r14.toFixed(1) : "—"} />
              <Metric label="SMA 20" value={s20?.toFixed(2) ?? "—"} />
              <Metric label="SMA 50" value={s50?.toFixed(2) ?? "—"} />
              <Metric label="1A Değişim" value={chg1m != null ? `${chg1m.toFixed(1)}%` : "—"} />
              <Metric label="3A Değişim" value={chg3m != null ? `${chg3m.toFixed(1)}%` : "—"} />
              <Metric label="Trend" value={s20 && s50 ? (s20 > s50 ? "Yükseliş" : "Düşüş") : "—"} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "teknik" && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Teknik Göstergeler (hesaplanan)</h3></div>
          <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Metric label="RSI (14)" value={r14 != null ? r14.toFixed(1) : "—"} />
            <Metric label="SMA (20)" value={s20?.toFixed(2) ?? "—"} />
            <Metric label="SMA (50)" value={s50?.toFixed(2) ?? "—"} />
            <Metric label="Fiyat / SMA20" value={s20 && q ? `${((q.price / s20 - 1) * 100).toFixed(1)}%` : "—"} />
            <Metric label="Fiyat / SMA50" value={s50 && q ? `${((q.price / s50 - 1) * 100).toFixed(1)}%` : "—"} />
            <Metric label="Sinyal" value={r14 == null ? "—" : r14 > 70 ? "Aşırı alım" : r14 < 30 ? "Aşırı satım" : "Nötr"} />
          </CardBody>
          <div className="px-5 pb-4 text-[11px] text-zinc-500">Gösterge aralığı: {hist.data?.length ?? 0} günlük kapanış · {range}</div>
        </Card>
      )}

      {tab === "haberler" && (
        <Card>
          <div className="px-5 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold">Haberler</h3></div>
          <CardBody>
            {news.data && Array.isArray(news.data) && news.data.length > 0 ? (
              <ul className="divide-y divide-zinc-800/60">
                {news.data.map((n: any, i: number) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <a href={n.link} target="_blank" rel="noreferrer" className="text-sm hover:text-emerald-400">{n.title}</a>
                    <div className="text-xs text-zinc-500 mt-1">{n.pubDate}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-zinc-500">Haber bulunamadı.</div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}