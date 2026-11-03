"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries, LineSeries } from "lightweight-charts";

export default function LineChart({
  data,
  color = "#34d399",
  height = 320,
}: {
  data: { time: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#a1a1aa" },
      width: ref.current.clientWidth,
      height,
      grid: { vertLines: { color: "#18181b" }, horzLines: { color: "#18181b" } },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a" },
    });
    const area = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: color + "44",
      bottomColor: color + "05",
    });
    area.setData(data as any);
    chart.timeScale().fitContent();
    inst.current = chart;
    const onResize = () => ref.current && chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      inst.current = null;
    };
  }, [data, color, height]);

  return <div ref={ref} className="w-full" />;
}