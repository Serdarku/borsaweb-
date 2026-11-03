import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const BASE = "https://www.tefas.gov.tr";

const VALID_PERIODS = [1, 3, 6, 12, 36, 60];

function monthsBack(days: number): number {
  const monthsNeeded = Math.ceil(days / 30) + 1;
  for (const p of VALID_PERIODS) {
    if (p >= monthsNeeded) return p;
  }
  return VALID_PERIODS[VALID_PERIODS.length - 1];
}

export async function getTefasFund(symbol: string): Promise<any> {
  const code = symbol.toUpperCase();
  const key = `tefas:fund:${code}`;
  const cached = cache.get<any>(key);
  if (cached) return cached;

  // list endpoint returns all funds; filter by code
  const url = `${BASE}/api/funds/fonGetiriBazliBilgiGetir`;
  try {
    const body = JSON.stringify({
      dil: "TR",
      fonTipi: "YAT",
      kurucuKodu: null,
      sfonTurKod: null,
      fonTurAciklama: null,
      islem: 1,
      fonTurKod: null,
      fonGrubu: null,
      donemGetiri1a: "1",
      donemGetiri3a: "1",
      donemGetiri6a: "1",
      donemGetiri1y: "1",
      donemGetiriyb: "1",
      donemGetiri3y: "1",
      donemGetiri5y: "1",
      basTarih: null,
      bitTarih: null,
      calismaTipi: 2,
      getiriOrani: "1",
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      body,
    });
    if (!res.ok) return { symbol: code, error: `HTTP ${res.status}` };
    const json = await res.json();
    const list = json?.resultList || json?.data || [];
    const fund = list.find((f: any) => (f.fonKodu || f.FONKODU || "").toUpperCase() === code);
    const result = fund || { symbol: code, note: "Fund not found in list" };
    cache.set(key, result, TTL.tefas);
    return result;
  } catch (e) {
    return { symbol: code, error: String(e) };
  }
}

export async function getTefasHistory(symbol: string, days: number = 30): Promise<any[]> {
  const code = symbol.toUpperCase();
  const key = `tefas:hist:${code}:${days}`;
  const cached = cache.get<any[]>(key);
  if (cached) return cached;

  const period = monthsBack(days);
  const url = `${BASE}/api/funds/fonFiyatBilgiGetir`;
  try {
    const body = JSON.stringify({ fonKodu: code, dil: "TR", periyod: period });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      body,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.resultList || json?.data || [];
    cache.set(key, Array.isArray(data) ? data : [], TTL.tefas);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}