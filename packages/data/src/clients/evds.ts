import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const BASE = "https://evds2.tcmb.gov.tr/service/evds";

export async function getEvdsSeries(
  series: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const key = process.env.EVDS_API_KEY;
  if (!key) {
    return { error: "EVDS_API_KEY tanimli degil", series, startDate, endDate };
  }
  const url = `${BASE}/series=${series}&startDate=${startDate}&endDate=${endDate}&type=json&key=${key}`;
  const cacheKey = `evds:${series}:${startDate}:${endDate}`;
  try {
    const res = await fetchWithRetry(url, { cacheKey, ttlMs: TTL.macro, headers: { "User-Agent": "Mozilla/5.0" } });
    return res.json();
  } catch (e) {
    return { error: String(e) };
  }
}