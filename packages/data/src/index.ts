// Veri erişim katmanı — BIST fiyat/geçmiş/mali veriler İş Yatırım'dan (Yahoo iptal).
export * from "@borsa/types";
export { cache, TTL } from "./utils/cache";
export { circuitCheck, circuitSuccess, circuitFailure, circuitStatus } from "./utils/circuit";
export { fetchWithRetry } from "./utils/fetchWithRetry";

// İş Yatırım (BIST): quote/quotes/history/fundamentals/endeks
export * from "./clients/isyatirim";

// Haber: İş Yatırım'da yok → KAP bildirimlerinden türüyor (getNews alias'ı aşağıda)
import { getKapNotifications } from "./clients/kap";

export async function getNews(
  input: string,
  limit: number = 10
): Promise<Array<{ title: string; link: string; pubDate?: string }>> {
  const symbol = input.trim().toUpperCase().replace(/\.IS$/, "");
  const items = await getKapNotifications(symbol, limit);
  return items.map((it) => ({
    title: it.title || it.summary || "KAP bildirimi",
    link: it.url || "https://www.kap.org.tr",
    pubDate: it.publishedAt,
  }));
}

// Yahoo'ya bağımlı olmayan diğer kaynaklar
export * from "./clients/coingecko";
export * from "./clients/fx";
export * from "./clients/tefas";
export * from "./clients/kap";
export * from "./clients/bddk";
export * from "./clients/evds";
export * from "./clients/macro";

import { circuitStatus } from "./utils/circuit";

export interface DataSourceHealth {
  source: string;
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export async function getDataHealth(): Promise<DataSourceHealth[]> {
  const sources = ["isyatirim", "coingecko", "frankfurter", "tcmb", "tefas", "kap"];
  const cb = circuitStatus();
  return sources.map((s) => {
    const c = cb.find((x) => x.host.includes(s) || s.includes(x.host.split(".")[0]));
    return {
      source: s,
      ok: !c || c.state !== "open",
      message: c ? `circuit: ${c.state} (${c.failures} failures)` : "ok",
    };
  });
}