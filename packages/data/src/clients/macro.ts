import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

const WB = "https://api.worldbank.org/v2";

export async function getMacroIndicators(country: string = "TR"): Promise<any> {
  const indicators = [
    { code: "NY.GDP.MKTP.KD.ZG", name: "GDP growth (annual %)" },
    { code: "NY.GDP.PCAP.CD", name: "GDP per capita (USD)" },
    { code: "FP.CPI.TOTL.ZG", name: "Inflation (CPI, annual %)" },
    { code: "SL.UEM.TOTL.ZS", name: "Unemployment (%)" },
    { code: "BN.CAB.XOKA.GD.ZS", name: "Current account (% of GDP)" },
    { code: "FI.RES.TOTL.CD", name: "Total reserves (USD)" },
  ];
  const results: any[] = [];
  for (const ind of indicators) {
    const url = `${WB}/country/${country}/indicator/${ind.code}?format=json&per_page=5`;
    const key = `wb:${country}:${ind.code}`;
    try {
      const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.macro });
      const json = await res.json();
      const data = Array.isArray(json) && json[1] ? json[1] : [];
      results.push({ code: ind.code, name: ind.name, data });
    } catch (e) {
      results.push({ code: ind.code, name: ind.name, error: String(e) });
    }
  }
  return { country, indicators: results };
}

export async function getInflationData(country: string = "TR"): Promise<any> {
  const url = `${WB}/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=10`;
  const key = `wb:infl:${country}`;
  try {
    const res = await fetchWithRetry(url, { cacheKey: key, ttlMs: TTL.macro });
    const json = await res.json();
    return { country, data: Array.isArray(json) && json[1] ? json[1] : [] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getPolicyRate(): Promise<any> {
  // TCMB politika faizi - EVDS uzerinden; anahtar yoksa placeholder
  if (!process.env.EVDS_API_KEY) {
    return { note: "EVDS_API_KEY tanimli degil; politika faizi icin EVDS gerekli." };
  }
  return getEvdsSeriesWrapper("TP.PYFR", "01-01-2024", "31-12-2025");
}

async function getEvdsSeriesWrapper(series: string, s: string, e: string) {
  const { getEvdsSeries } = await import("./evds");
  return getEvdsSeries(series, s, e);
}