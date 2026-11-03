// Veri erişim katmanı (iskelet)
// Faz 1'de Yahoo, CoinGecko, FX, TCMB, TEFAS, KAP, BDDK, EVDS istemcileri eklenecek.
// Metehan Finance-MCP kalıpları (cache, retry, circuit breaker) buraya port edilecek.

export * from "@borsa/types";

export interface DataSourceHealth {
  source: string;
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export async function getDataHealth(): Promise<DataSourceHealth[]> {
  // TODO: Faz 1
  return [];
}