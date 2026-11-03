import { Quote, OHLCBar, Fundamentals } from "@borsa/types";
import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const BASE = "https://query1.finance.yahoo.com";

let crumbCache: { crumb: string; cookie: string; expires: number } | null = null;

async function getCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (crumbCache && Date.now() < crumbCache.expires) return crumbCache;
  const r1 = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });
  const setCookie = r1.headers.get("set-cookie") || "";
  const cookie = setCookie
    .split(/,(?=[^;]+;)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
  const r2 = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie },
  });
  const crumb = (await r2.text()).trim();
  if (!crumb || crumb.includes("error") || crumb.length > 40) {
    // fallback: try without crumb
    crumbCache = { crumb: "", cookie, expires: Date.now() + 5 * 60_000 };
    return crumbCache;
  }
  crumbCache = { crumb, cookie, expires: Date.now() + 30 * 60_000 };
  return crumbCache;
}

async function fetchYahooJson(path: string, cacheKey?: string, ttlMs?: number): Promise<any> {
  const { crumb, cookie } = await getCrumb();
  const sep = path.includes("?") ? "&" : "?";
  const crumbParam = crumb ? `${sep}crumb=${encodeURIComponent(crumb)}` : "";
  const url = `${BASE}${path}${crumbParam}`;
  const res = await fetchWithRetry(url, {
    cacheKey,
    ttlMs,
    headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie },
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  return res.json();
}

function resolveSymbol(input: string): string {
  const s = input.trim().toUpperCase();
  if (s.includes(".")) return s;
  if (/^[A-Z]{3,6}$/.test(s)) return `${s}.IS`;
  return s;
}

export async function getQuote(input: string): Promise<Quote> {
  const symbol = resolveSymbol(input);
  const path = `/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const key = `yahoo:quote:${symbol}`;
  const json = await fetchYahooJson(path, key, TTL.quote);
  const r = json?.quoteResponse?.result?.[0];
  if (!r) throw new Error(`Quote not found: ${symbol}`);
  return {
    symbol: r.symbol,
    name: r.shortName || r.longName,
    price: r.regularMarketPrice,
    change: r.regularMarketChange,
    changePercent: r.regularMarketChangePercent,
    currency: r.currency,
    marketCap: r.marketCap,
    volume: r.regularMarketVolume,
    dayHigh: r.regularMarketDayHigh,
    dayLow: r.regularMarketDayLow,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    timestamp: new Date((r.regularMarketTime || Date.now() / 1000) * 1000).toISOString(),
  };
}

export async function getQuotes(inputs: string[]): Promise<Quote[]> {
  const symbols = inputs.map(resolveSymbol);
  const path = `/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
  const key = `yahoo:quotes:${symbols.join(",")}`;
  const json = await fetchYahooJson(path, key, TTL.quote);
  const results = json?.quoteResponse?.result || [];
  return results.map((r: any) => ({
    symbol: r.symbol,
    name: r.shortName || r.longName,
    price: r.regularMarketPrice,
    change: r.regularMarketChange,
    changePercent: r.regularMarketChangePercent,
    currency: r.currency,
    marketCap: r.marketCap,
    volume: r.regularMarketVolume,
    dayHigh: r.regularMarketDayHigh,
    dayLow: r.regularMarketDayLow,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    timestamp: new Date((r.regularMarketTime || Date.now() / 1000) * 1000).toISOString(),
  }));
}

export async function getHistory(
  input: string,
  range: string = "6mo",
  interval: string = "1d"
): Promise<OHLCBar[]> {
  const symbol = resolveSymbol(input);
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const key = `yahoo:hist:${symbol}:${range}:${interval}`;
  const json = await fetchYahooJson(path, key, TTL.history);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`History not found: ${symbol}`);
  const ts = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  const bars: OHLCBar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    bars.push({
      date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: q.volume?.[i],
    });
  }
  return bars;
}

export async function getFundamentals(input: string): Promise<Fundamentals & { profile?: any; raw?: any }> {
  const symbol = resolveSymbol(input);
  const path = `/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price,summaryDetail,financialData,defaultKeyStatistics,assetProfile`;
  const key = `yahoo:fund:${symbol}`;
  const json = await fetchYahooJson(path, key, TTL.fundamentals);
  const r = json?.quoteSummary?.result?.[0] || {};
  const price = r.price || {};
  const sd = r.summaryDetail || {};
  const fd = r.financialData || {};
  const ks = r.defaultKeyStatistics || {};
  const ap = r.assetProfile || {};
  return {
    pe: sd.trailingPE?.raw ?? ks.trailingPE?.raw,
    pb: sd.priceToBook?.raw ?? ks.priceToBook?.raw,
    eps: ks.trailingEps?.raw,
    dividendYield: sd.dividendYield?.raw,
    roe: fd.returnOnEquity?.raw,
    beta: sd.beta?.raw ?? ks.beta?.raw,
    marketCap: price.marketCap?.raw,
    sector: ap.sector,
    industry: ap.industry,
    profile: ap,
    raw: r,
  };
}

export async function searchSymbols(query: string, limit: number = 10): Promise<Array<{ symbol: string; name: string; exchange?: string; type?: string }>> {
  const path = `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0`;
  const key = `yahoo:search:${query}:${limit}`;
  const json = await fetchYahooJson(path, key, TTL.fundamentals);
  const quotes = json?.quotes || [];
  return quotes.slice(0, limit).map((q: any) => ({
    symbol: q.symbol,
    name: q.shortname || q.longname || q.symbol,
    exchange: q.exchange,
    type: q.quoteType,
  }));
}

export async function getNews(input: string, limit: number = 10): Promise<Array<{ title: string; link: string; pubDate?: string }>> {
  const symbol = resolveSymbol(input);
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  const key = `yahoo:news:${symbol}`;
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.kap, headers: { "User-Agent": "Mozilla/5.0" } });
  const text = await res.text();
  const items: Array<{ title: string; link: string; pubDate?: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(text)) && items.length < limit) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1];
    const link = (block.match(/<link>(.*?)<\/link>/))?.[1];
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1];
    if (title && link) items.push({ title: title.trim(), link: link.trim(), pubDate });
  }
  return items;
}

export async function getTrending(region: string = "US"): Promise<Array<{ symbol: string; name?: string }>> {
  const path = `/v1/finance/trending/${region}`;
  const key = `yahoo:trending:${region}`;
  const json = await fetchYahooJson(path, key, TTL.quote);
  const quotes = json?.finance?.result?.[0]?.quotes || [];
  return quotes.map((q: any) => ({ symbol: q.symbol, name: q.shortName }));
}

export async function getMarketMovers(screener: string = "most_actives"): Promise<Array<{ symbol: string; name?: string; price?: number; changePercent?: number }>> {
  const path = `/v1/finance/screener/predefined/saved?scrIds=${screener}&count=25`;
  const key = `yahoo:movers:${screener}`;
  const json = await fetchYahooJson(path, key, TTL.quote);
  const quotes = json?.finance?.result?.[0]?.quotes || [];
  return quotes.map((q: any) => ({
    symbol: q.symbol,
    name: q.shortName,
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent,
  }));
}