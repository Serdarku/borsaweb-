import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const FRANKFURTER = "https://api.frankfurter.app";

export async function getExchangeRate(from: string, to: string, date?: string): Promise<{ rate: number; date: string }> {
  const d = date || "latest";
  const url = `${FRANKFURTER}/${d}?from=${from}&to=${to}`;
  const key = `fx:rate:${from}:${to}:${d}`;
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.fx });
  const json = await res.json();
  const rate = json?.rates?.[to];
  if (rate == null) throw new Error(`Rate not found ${from}->${to}`);
  return { rate, date: json.date };
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<{ result: number; rate: number }> {
  const { rate } = await getExchangeRate(from, to);
  return { result: amount * rate, rate };
}

export async function getHistoricalRate(from: string, to: string, start: string, end: string): Promise<Record<string, number>> {
  const url = `${FRANKFURTER}/${start}..${end}?from=${from}&to=${to}`;
  const key = `fx:hist:${from}:${to}:${start}:${end}`;
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.macro });
  const json = await res.json();
  const out: Record<string, number> = {};
  for (const [d, r] of Object.entries(json?.rates || {})) {
    out[d] = (r as any)?.[to];
  }
  return out;
}

// TCMB resmi kurlar (today.xml)
export interface TcmbRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  effective?: string;
}

export async function getTcmbRates(): Promise<{ date: string; rates: TcmbRate[] }> {
  const url = "https://www.tcmb.gov.tr/kurlar/today.xml";
  const key = "tcmb:today";
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.fx, headers: { "User-Agent": "Mozilla/5.0" } });
  const text = await res.text();
  const dateMatch = text.match(/Tarih="([^"]+)"/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
  const rates: TcmbRate[] = [];
  const currencyRegex = /<Currency[^>]*Kod="([^"]+)"[^>]*>([\s\S]*?)<\/Currency>/g;
  let m;
  while ((m = currencyRegex.exec(text))) {
    const code = m[1];
    const block = m[2];
    const name = (block.match(/<Isim>(.*?)<\/Isim>/)?.[1] || "").trim();
    const buy = parseFloat(block.match(/<ForexBuying>(.*?)<\/ForexBuying>/)?.[1] || "0");
    const sell = parseFloat(block.match(/<ForexSelling>(.*?)<\/ForexSelling>/)?.[1] || "0");
    if (code && (buy || sell)) rates.push({ code, name, buy, sell });
  }
  return { date, rates };
}