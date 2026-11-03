import { NextResponse } from "next/server";
import { getCryptoPrice, getFearGreed, getExchangeRate, getTcmbRates, getTefasHistory, getKapNotifications, getMacroIndicators } from "@borsa/data";

export async function GET() {
  const results: any = {};
  const tasks = [
    ["crypto", async () => getCryptoPrice("bitcoin", "usd")],
    ["fng", async () => getFearGreed()],
    ["fx", async () => getExchangeRate("USD", "TRY")],
    ["tcmb", async () => getTcmbRates()],
    ["tefas", async () => getTefasHistory("MAC", 5)],
    ["kap", async () => getKapNotifications("THYAO", 5)],
    ["macro", async () => getMacroIndicators("TR")],
  ] as const;
  for (const [name, fn] of tasks) {
    try {
      const data = await (fn as any)();
      results[name] = { ok: true, preview: JSON.stringify(data).slice(0, 300) };
    } catch (e: any) {
      results[name] = { ok: false, error: e?.message || String(e) };
    }
  }
  return NextResponse.json(results);
}