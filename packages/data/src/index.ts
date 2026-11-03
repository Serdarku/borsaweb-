// Veri erişim katmanı (Faz 1)
export * from "@borsa/types";
export { cache, TTL } from "./utils/cache";
export { circuitCheck, circuitSuccess, circuitFailure, circuitStatus } from "./utils/circuit";
export { fetchWithRetry } from "./utils/fetchWithRetry";

export * from "./clients/yahoo";
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
  const sources = ["yahoo", "coingecko", "frankfurter", "tcmb", "tefas", "kap"];
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