import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const BASE = "https://api.coingecko.com/api/v3";

async function fetchJson(url: string, cacheKey?: string, ttlMs?: number): Promise<any> {
  const res = await fetchWithRetry(url, { cacheKey, ttlMs, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  return res.json();
}

export async function getCryptoPrice(
  id: string,
  vs: string = "usd"
): Promise<{ id: string; prices: Record<string, number> }> {
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=${vs}`;
  const key = `cg:price:${id}:${vs}`;
  const json = await fetchJson(url, key, TTL.quote);
  return { id, prices: json?.[id] || {} };
}

export async function getMultiCryptoPrice(
  ids: string[],
  vs: string = "usd"
): Promise<Record<string, Record<string, number>>> {
  const url = `${BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=${vs}`;
  const key = `cg:multiprice:${ids.join(",")}:${vs}`;
  const json = await fetchJson(url, key, TTL.quote);
  return json || {};
}

export async function getCryptoHistory(
  id: string,
  days: number = 90,
  vs: string = "usd"
): Promise<Array<{ date: string; price: number }>> {
  const url = `${BASE}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${vs}&days=${days}`;
  const key = `cg:hist:${id}:${vs}:${days}`;
  const json = await fetchJson(url, key, TTL.history);
  const prices: [number, number][] = json?.prices || [];
  return prices.map(([ts, p]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    price: p,
  }));
}

export async function getCryptoMarkets(
  vs: string = "usd",
  perPage: number = 50,
  page: number = 1
): Promise<any[]> {
  const url = `${BASE}/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d`;
  const key = `cg:markets:${vs}:${perPage}:${page}`;
  return fetchJson(url, key, TTL.quote);
}

export async function getCryptoMovers(vs: string = "usd"): Promise<{
  topGainers: any[];
  topLosers: any[];
  median: number;
}> {
  const markets = await getCryptoMarkets(vs, 100, 1);
  const sorted = [...markets].sort(
    (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );
  const changes = markets.map((m) => m.price_change_percentage_24h || 0).sort((a, b) => a - b);
  const median = changes.length ? changes[Math.floor(changes.length / 2)] : 0;
  return {
    topGainers: sorted.slice(0, 10),
    topLosers: sorted.slice(-10).reverse(),
    median,
  };
}

export async function getFearGreed(): Promise<any> {
  const url = "https://api.alternative.me/fng/?limit=31";
  const key = "cg:fng";
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.macro, headers: { Accept: "application/json" } });
  return res.json();
}

export async function getCryptoGlobal(): Promise<any> {
  const url = `${BASE}/global`;
  const key = "cg:global";
  const json = await fetchJson(url, key, TTL.macro);
  return json?.data;
}