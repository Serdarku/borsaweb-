import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const BASE = "https://www.bddk.org.tr/BultenAylik";

export interface BddkRow {
  cells: any[];
  period?: string;
}

export async function fetchBddkTable(
  tableNo: number,
  year: number,
  month: number,
  currency: string = "TL",
  group: string = "10004",
  lang: string = "tr"
): Promise<{ rows: any[]; raw?: any }> {
  const url = `${BASE}/${lang}/Home/BasitRaporGetir`;
  const key = `bddk:${tableNo}:${year}:${month}:${currency}:${group}:${lang}`;
  const cached = cache.get<any>(key);
  if (cached) return cached;

  try {
    const body = new URLSearchParams({
      tabloNo: String(tableNo),
      yil: String(year),
      ay: String(month),
      paraBirimi: currency,
      taraf: group,
    }).toString();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "User-Agent": "Mozilla/5.0",
        Referer: `${BASE}/${lang}/`,
        Origin: "https://www.bddk.org.tr",
      },
      body,
    });
    if (!res.ok) return { rows: [], raw: { status: res.status } };
    const json = await res.json();
    const rows = json?.Json?.data?.rows?.map((r: any) => r.cell) || [];
    const result = { rows, raw: json };
    cache.set(key, result, TTL.macro);
    return result;
  } catch (e) {
    return { rows: [], raw: { error: String(e) } };
  }
}

// Convenience: fetch latest ratios table (table 15) for a given period
export async function getBddkRatios(year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth(); // previous month approx (data published with lag)
  const safeMonth = m === 0 ? 12 : m;
  const safeYear = m === 0 ? y - 1 : y;
  return fetchBddkTable(15, safeYear, safeMonth, "TL", "10004", "tr");
}

export async function getBddkBankingData() {
  const r = await getBddkRatios();
  return { period: `${new Date().getFullYear()}`, rows: r.rows, raw: r.raw };
}