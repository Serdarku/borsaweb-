import type { Quote } from "@borsa/types";

const sample: Quote = {
  symbol: "THYAO",
  name: "Türk Hava Yolları",
  price: 312.5,
  change: 4.2,
  changePercent: 1.36,
  currency: "TRY",
  timestamp: new Date().toISOString(),
};

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-2">BorsaWeb</h1>
      <p className="text-zinc-400 mb-6">
        Birleşik Türkiye finans platformu — iskelet (Faz 0) çalışıyor.
      </p>
      <div className="rounded-lg border border-zinc-800 p-4 max-w-md">
        <div className="text-sm text-zinc-400">Örnek hisse</div>
        <div className="text-xl font-semibold">{sample.symbol}</div>
        <div className="text-zinc-300">{sample.name}</div>
        <div className="mt-2 text-2xl">
          {sample.price.toFixed(2)} {sample.currency}
        </div>
        <div className={sample.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
          {sample.change >= 0 ? "+" : ""}
          {sample.change.toFixed(2)} ({sample.changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="mt-6 text-sm text-zinc-500">
        API sağlık kontrolü: <code className="text-zinc-300">/api/health</code>
      </div>
    </main>
  );
}