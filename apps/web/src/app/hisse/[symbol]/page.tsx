"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function HisseDetay() {
  const params = useParams();
  const symbol = (params?.symbol as string) || "THYAO";
  const [range, setRange] = useState("6mo");
  const quote = useQuery({ queryKey: ["q", symbol], queryFn: () => j(`/api/quote?symbol=${symbol}`) });
  const fund = useQuery({ queryKey: ["fund", symbol], queryFn: () => j(`/api/fundamentals?symbol=${symbol}`) });
  const hist = useQuery({ queryKey: ["hist", symbol, range], queryFn: () => j(`/api/history?symbol=${symbol}&range=${range}`) });
  const news = useQuery({ queryKey: ["news", symbol], queryFn: () => j(`/api/news?symbol=${symbol}`) });

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !hist.data || !Array.isArray(hist.data)) return;
    if (chartInstance.current) {
      chartInstance.current.remove();
      chartInstance.current = null;
    }
    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0a0a0a" }, textColor: "#d4d4d8" },
      width: chartRef.current.clientWidth,
      height: 360,
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });
    const data = hist.data.map((b: any) => ({
      time: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();
    chartInstance.current = chart;
    const onResize = () => chart.applyOptions({ width: chartRef.current!.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartInstance.current = null;
    };
  }, [hist.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">{symbol}</h1>
        {quote.data && (
          <span className="text-xl">
            {quote.data.price?.toFixed(2)} {quote.data.currency}
            <span className={quote.data.changePercent >= 0 ? "text-emerald-400 ml-2" : "text-rose-400 ml-2"}>
              {quote.data.changePercent?.toFixed(2)}%
            </span>
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {["1mo", "3mo", "6mo", "1y", "2y"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded text-sm border ${range === r ? "bg-zinc-700 border-zinc-500" : "border-zinc-800 text-zinc-400"}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div ref={chartRef} className="w-full rounded-lg border border-zinc-800 bg-black" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-800 p-4">
          <h2 className="font-semibold mb-2">Temel Veriler</h2>
          {fund.data ? (
            <ul className="text-sm space-y-1 text-zinc-300">
              <li>F/K: {fund.data.pe?.toFixed(2) ?? "—"}</li>
              <li>PD/DD: {fund.data.pb?.toFixed(2) ?? "—"}</li>
              <li>EPS: {fund.data.eps?.toFixed(2) ?? "—"}</li>
              <li>Temettü Verimi: {fund.data.dividendYield != null ? (fund.data.dividendYield * 100).toFixed(2) + "%" : "—"}</li>
              <li>ROE: {fund.data.roe != null ? (fund.data.roe * 100).toFixed(2) + "%" : "—"}</li>
              <li>Beta: {fund.data.beta?.toFixed(2) ?? "—"}</li>
              <li>Sektör: {fund.data.sector ?? "—"}</li>
              <li>Sanayi: {fund.data.industry ?? "—"}</li>
            </ul>
          ) : (
            <div className="text-zinc-500">Yükleniyor…</div>
          )}
        </div>
        <div className="rounded-lg border border-zinc-800 p-4">
          <h2 className="font-semibold mb-2">Haberler</h2>
          {news.data && Array.isArray(news.data) ? (
            <ul className="text-sm space-y-2">
              {news.data.slice(0, 8).map((n: any, i: number) => (
                <li key={i}>
                  <a href={n.link} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white">
                    {n.title}
                  </a>
                  <div className="text-xs text-zinc-500">{n.pubDate}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-zinc-500">Yükleniyor…</div>
          )}
        </div>
      </div>

      {quote.data && (
        <div className="rounded-lg border border-zinc-800 p-4 text-sm text-zinc-400">
          Piyasa Değeri: {quote.data.marketCap?.toLocaleString()} {quote.data.currency} · Hacim: {quote.data.volume?.toLocaleString()} · 52H: {quote.data.fiftyTwoWeekLow} - {quote.data.fiftyTwoWeekHigh}
        </div>
      )}
    </div>
  );
}