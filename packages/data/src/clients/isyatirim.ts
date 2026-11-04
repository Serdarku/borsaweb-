// İş Yatırım veri istemcisi — Yahoo Finance yerine.
// Uçlar (isyatirimhisse kütüphanesinin kullandıklarıyla aynı, auth gerekmez):
//   HisseTekil  -> OHLCV geçmişi + BIST100 (END_DEGER) + sermaye + USD fiyatı
//   MaliTablo   -> bilanço/kâr satırları (F/K, PD/DD, ROE türetmek için)
import { Quote, OHLCBar, Fundamentals } from "@borsa/types";
import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const DATA = "https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx";
const HEADERS = { "User-Agent": "Mozilla/5.0", Accept: "application/json" };

function toTrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}
function fromTrDate(s: string): string {
  // "03-11-2026" -> "2026-11-03"
  if (typeof s !== "string") return s;
  const [d, m, y] = s.split("-");
  if (y && m && d) return `${y}-${m}-${d}`;
  return s;
}

export function normalizeSymbol(input: string): string {
  // "THYAO", "THYAO.IS", "thyao" -> "THYAO"
  return input.trim().toUpperCase().replace(/\.IS$/, "").replace(/\..*$/, "");
}

const RANGE_DAYS: Record<string, number> = {
  "5d": 7, "1mo": 37, "3mo": 95, "6mo": 190, "1y": 380, "2y": 740, "5y": 1850,
};

async function hisseTekil(symbol: string, start: string, end: string): Promise<any[]> {
  const url = `${DATA}/HisseTekil?hisse=${encodeURIComponent(symbol)}&startdate=${start}&enddate=${end}`;
  const key = `isy:ht:${symbol}:${start}:${end}`;
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.history, headers: HEADERS });
  if (!res.ok) throw new Error(`İş Yatırım HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.errorDescription || "İş Yatırım yanıt hatalı");
  return json.value || [];
}

async function fetchBars(symbol: string, range: string): Promise<OHLCBar[]> {
  const days = RANGE_DAYS[range] || RANGE_DAYS["6mo"];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const rows = await hisseTekil(symbol, toTrDate(start), toTrDate(end));
  return rows.map((r: any) => ({
    date: fromTrDate(r.HGDG_TARIH),
    open: Number(r.HGDG_AOF ?? r.HGDG_KAPANIS),
    high: Number(r.HGDG_MAX),
    low: Number(r.HGDG_MIN),
    close: Number(r.HGDG_KAPANIS),
    volume: Number(r.HGDG_HACIM),
  }));
}

export async function getHistory(input: string, range: string = "6mo", _interval?: string): Promise<OHLCBar[]> {
  return fetchBars(normalizeSymbol(input), range);
}

export async function getQuote(input: string): Promise<Quote> {
  const symbol = normalizeSymbol(input);
  const bars = await fetchBars(symbol, "5d");
  if (bars.length < 1) throw new Error(`Fiyat bulunamadı: ${symbol}`);
  const last = bars[bars.length - 1];
  const prev = bars.length > 1 ? bars[bars.length - 2] : last;
  const change = last.close - prev.close;
  const changePercent = prev.close ? (change / prev.close) * 100 : 0;
  // 52 haftalık aralık için ayrı cache'li istek
  const yearBars = await fetchBars(symbol, "1y");
  const highs = yearBars.map((b) => b.high);
  const lows = yearBars.map((b) => b.low);
  return {
    symbol,
    price: last.close,
    change,
    changePercent,
    currency: "TRY",
    dayHigh: last.high,
    dayLow: last.low,
    volume: last.volume,
    fiftyTwoWeekHigh: highs.length ? Math.max(...highs) : last.high,
    fiftyTwoWeekLow: lows.length ? Math.min(...lows) : last.low,
    timestamp: new Date().toISOString(),
  };
}

export async function getQuotes(inputs: string[]): Promise<Quote[]> {
  const out: Quote[] = [];
  for (const s of inputs) {
    try { out.push(await getQuote(s)); } catch { /* atla */ }
  }
  return out;
}

// BIST100 endeksi — HisseTekil satırındaki END_DEGER'den türetilir (THYAO referans sembolü).
export async function getIndexQuote(symbol: string = "THYAO"): Promise<Quote> {
  const ref = normalizeSymbol(symbol) || "THYAO";
  const days = 380;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const rows = await hisseTekil(ref, toTrDate(start), toTrDate(end));
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2] || last;
  const val = Number(last?.END_DEGER);
  const prevVal = Number(prev?.END_DEGER);
  return {
    symbol: "XU100",
    name: "BIST %100",
    price: val,
    change: val - prevVal,
    changePercent: prevVal ? ((val - prevVal) / prevVal) * 100 : 0,
    currency: "TRY",
    fiftyTwoWeekHigh: Math.max(...rows.map((r: any) => Number(r.END_DEGER))),
    fiftyTwoWeekLow: Math.min(...rows.map((r: any) => Number(r.END_DEGER))),
    timestamp: new Date().toISOString(),
  };
}

async function maliTablo(symbol: string, year: number): Promise<any[]> {
  // Son 2 yıl, yıllık (period=12) konsolideXI_29 grup
  const url =
    `${DATA}/MaliTablo?companyCode=${symbol}&exchange=TRY&financialGroup=XI_29` +
    `&year1=${year - 1}&period1=12&year2=${year}&period2=12&year3=${year}&period3=12&year4=${year}&period4=12`;
  const key = `isy:mt:${symbol}:${year}`;
  const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.fundamentals, headers: HEADERS });
  if (!res.ok) throw new Error(`İş Yatırım mali tablo HTTP ${res.status}`);
  const json = await res.json();
  return json?.value || [];
}

function pick(rows: any[], codes: string[], descRe?: RegExp): number | null {
  for (const c of codes) {
    const r = rows.find((x) => x.itemCode === c);
    if (r) { const v = Number(r.value4 ?? r.value3 ?? r.value2 ?? r.value1); if (!Number.isNaN(v)) return v; }
  }
  if (descRe) {
    const r = rows.find((x) => descRe.test((x.itemDescTr || "").replace(/\s/g, "")));
    if (r) { const v = Number(r.value4); if (!Number.isNaN(v)) return v; }
  }
  return null;
}

export async function getFundamentals(input: string): Promise<Fundamentals> {
  const symbol = normalizeSymbol(input);
  const year = new Date().getFullYear();
  let rows: any[] = [];
  try { rows = await maliTablo(symbol, year); } catch {
    try { rows = await maliTablo(symbol, year - 1); } catch { /* boş */ }
  }
  const quote = await getQuote(symbol).catch(() => null);
  const price = quote?.price ?? 0;

  const netIncome = pick(rows, ["2OCF", "3Z", "52"], /DnemNetKar|NetDnemKar/i);
  const equity = pick(rows, ["2O", "3", "40"], /AnaOrtakligaAitOzkaynak|ToplamOzkaynak/i);
  // Sermaye (nominal, bin TL değil — HisseTekil SERMAYE alanı) — pay sayısı için
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 10);
  const ht = await hisseTekil(symbol, toTrDate(start), toTrDate(end));
  const sermaye = Number(ht[ht.length - 1]?.SERMAYE || 0);
  const shares = sermaye > 1e6 ? sermaye : 0; // nominal TL ≈ lot (1 kr varsayımı); tutarsızsa 0
  const marketCap = shares && price ? shares * price : undefined;
  const eps = shares && netIncome != null ? netIncome / shares : undefined;
  const pe = marketCap && netIncome ? marketCap / netIncome : (eps && price ? price / eps : undefined);
  const book = equity;
  const pb = marketCap && book ? marketCap / book : undefined;
  const roe = netIncome != null && book ? netIncome / book : undefined;

  return {
    pe: pe && pe > 0 ? pe : undefined,
    pb: pb && pb > 0 ? pb : undefined,
    eps,
    roe,
    marketCap,
    // İş Yatırım mali tabloda beta/temettü yok
    dividendYield: undefined,
    beta: undefined,
  };
}

export interface IsyFinancialRow {
  code: string; tr: string; en: string; value4: number | null; value1: number | null;
}
export async function getFinancialStatement(input: string, year?: number): Promise<IsyFinancialRow[]> {
  const symbol = normalizeSymbol(input);
  const y = year ?? new Date().getFullYear();
  const rows = await maliTablo(symbol, y);
  return rows.map((r: any) => ({
    code: r.itemCode,
    tr: (r.itemDescTr || "").replace(/^\s+/, ""),
    en: r.itemDescEng,
    value4: r.value4 != null && r.value4 !== "" ? Number(r.value4) : null,
    value1: r.value1 != null && r.value1 !== "" ? Number(r.value1) : null,
  }));
}