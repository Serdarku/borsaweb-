// Deterministic RNG (mulberry32) — seed'li, test edilebilir
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller ile normal dağılım
function makeNormal(rand: () => number) {
  let spare: number | null = null;
  return function () {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0, v = 0, s = 0;
    do {
      u = rand() * 2 - 1;
      v = rand() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };
}

function logReturns(prices: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < prices.length; i++) r.push(Math.log(prices[i] / prices[i - 1]));
  return r;
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[], ddof = 1): number {
  const n = xs.length;
  if (n <= ddof) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (n - ddof));
}

function pct(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const idx = (q / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const TRADING_DAYS = 252;

// ---------- Monte Carlo (GBM) ----------
export interface MonteCarloInput {
  prices: number[];
  days?: number;
  paths?: number;
}

export function monteCarlo(inp: MonteCarloInput) {
  const prices = inp.prices;
  if (!Array.isArray(prices) || prices.length < 5) throw new Error("yetersiz fiyat verisi");
  const days = inp.days ?? 250;
  const paths = Math.min(inp.paths ?? 2500, 5000);

  const lr = logReturns(prices);
  const mu = mean(lr);
  const sigma = std(lr, 1);
  const s0 = prices[prices.length - 1];

  const rand = mulberry32(42);
  const normal = makeNormal(rand);
  const drift = mu - 0.5 * sigma * sigma;

  const terminals: number[] = [];
  const samplePaths: number[][] = [];
  let sumMaxDD = 0;

  for (let p = 0; p < paths; p++) {
    let cum = 0;
    let peak = s0;
    let maxDD = 0;
    const path: number[] = p < 10 ? [s0] : [];
    for (let t = 0; t < days; t++) {
      cum += drift + sigma * normal();
      const price = s0 * Math.exp(cum);
      if (price > peak) peak = price;
      const dd = (price - peak) / peak;
      if (dd < maxDD) maxDD = dd;
      if (path.length) path.push(price);
    }
    terminals.push(s0 * Math.exp(cum));
    sumMaxDD += maxDD;
    if (path.length) samplePaths.push(path);
  }

  const sorted = [...terminals].sort((a, b) => a - b);
  const p5 = pct(sorted, 5);
  const tail = sorted.filter((v) => v <= p5);
  const var95 = s0 - p5;
  const cvar95 = s0 - (tail.length ? mean(tail) : p5);

  return {
    current: s0,
    mu_daily: mu,
    sigma_daily: sigma,
    mu_annual: mu * TRADING_DAYS,
    sigma_annual: sigma * Math.sqrt(TRADING_DAYS),
    days,
    paths,
    bear_5: pct(sorted, 5),
    base_50: pct(sorted, 50),
    bull_95: pct(sorted, 95),
    var95,
    cvar95,
    expected_terminal: mean(terminals),
    prob_profit: terminals.filter((t) => t > s0).length / paths,
    avg_max_drawdown: sumMaxDD / paths,
    sample_paths: samplePaths,
  };
}

// ---------- Markowitz ----------
export interface MarkowitzInput {
  series: Record<string, number[]>;
  risk_free?: number;
}

export function markowitz(inp: MarkowitzInput) {
  const series = inp.series;
  const names = Object.keys(series);
  if (names.length < 2) throw new Error("en az 2 varlik gerekli");

  const minLen = Math.min(...names.map((n) => series[n].length));
  if (minLen < 10) throw new Error("yetersiz tarih aralığı");

  // günlük log-getiriler
  const rets: number[][] = names.map((n) => {
    const p = series[n].slice(-minLen);
    return logReturns(p);
  });
  const T = rets[0].length;
  const meanRet = rets.map((r) => mean(r) * TRADING_DAYS);

  const n = names.length;
  const cov: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const mi = meanRet[i] / TRADING_DAYS;
      const mj = meanRet[j] / TRADING_DAYS;
      let c = 0;
      for (let t = 0; t < T; t++) c += (rets[i][t] - mi) * (rets[j][t] - mj);
      c = (c / (T - 1)) * TRADING_DAYS;
      cov[i][j] = c;
      cov[j][i] = c;
    }
  }

  const rf = inp.risk_free ?? 0;
  const rand = mulberry32(7);
  const results: Array<{ sharpe: number; w: number[]; pr: number; pv: number }> = [];
  const N = 10000;

  for (let k = 0; k < N; k++) {
    const raw = new Array(n).fill(0).map(() => rand());
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    const w = raw.map((x) => x / sum);
    let pr = 0;
    for (let i = 0; i < n; i++) pr += w[i] * meanRet[i];
    let vs = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) vs += w[i] * w[j] * cov[i][j];
    const pv = Math.sqrt(Math.max(vs, 0));
    const sharpe = pv > 0 ? (pr - rf) / pv : 0;
    results.push({ sharpe, w, pr, pv });
  }

  let best = results[0];
  let minVar = results[0];
  for (const r of results) {
    if (r.sharpe > best.sharpe) best = r;
    if (r.pv < minVar.pv) minVar = r;
  }

  const weightsOf = (w: number[]) => Object.fromEntries(names.map((nm, i) => [nm, w[i]]));
  const frontier = [...results]
    .sort((a, b) => a.pv - b.pv)
    .slice(0, 50)
    .map((r) => ({ vol: r.pv, ret: r.pr, sharpe: r.sharpe }));

  return {
    assets: names,
    max_sharpe: { weights: weightsOf(best.w), expected_return: best.pr, volatility: best.pv, sharpe: best.sharpe },
    min_variance: { weights: weightsOf(minVar.w), expected_return: minVar.pr, volatility: minVar.pv, sharpe: minVar.sharpe },
    frontier_sample: frontier,
    annualized_returns: Object.fromEntries(names.map((nm, i) => [nm, meanRet[i]])),
  };
}

// ---------- Risk metrikleri ----------
export interface RiskInput {
  returns: number[];
  weights?: number[];
}

export function riskMetrics(inp: RiskInput) {
  const r = inp.returns;
  if (!Array.isArray(r) || r.length < 2) throw new Error("yetersiz veri");

  const total = r.reduce((a, b) => a * (1 + b), 1) - 1;
  const annRet = mean(r) * TRADING_DAYS;
  const annVol = std(r, 1) * Math.sqrt(TRADING_DAYS);
  const sharpe = annVol > 0 ? annRet / annVol : 0;
  const downside = r.filter((x) => x < 0);
  const ddDev = downside.length > 1 ? std(downside, 1) * Math.sqrt(TRADING_DAYS) : 0;
  const sortino = ddDev > 0 ? annRet / ddDev : 0;

  let cum = 1;
  let peak = 1;
  let maxDD = 0;
  for (const x of r) {
    cum *= 1 + x;
    if (cum > peak) peak = cum;
    const dd = (cum - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  let hhi: number | null = null;
  if (inp.weights) {
    const s = inp.weights.reduce((a, b) => a + b, 0) || 1;
    hhi = inp.weights.reduce((a, b) => a + (b / s) * (b / s), 0);
  }

  return {
    total_return: total,
    annualized_return: annRet,
    annualized_volatility: annVol,
    sharpe,
    sortino,
    max_drawdown: maxDD,
    calmar: maxDD !== 0 ? annRet / Math.abs(maxDD) : 0,
    hhi,
    n: r.length,
  };
}

// ---------- Stres testi ----------
export const SCENARIOS: Record<string, Record<string, number>> = {
  bist_crash: { equity: -0.3, fx: 0.25, bond: -0.05, commodity: -0.1 },
  fx_shock: { equity: -0.1, fx: 0.25, bond: -0.02, commodity: 0.05 },
  rate_hike: { equity: -0.15, fx: 0.1, bond: -0.12, commodity: -0.05 },
  stagflation: { equity: -0.2, fx: 0.2, bond: -0.08, commodity: 0.15 },
};

function classify(symbol: string): string {
  const s = symbol.toUpperCase();
  if (["USD", "EUR", "FX", "GBP"].some((k) => s.includes(k))) return "fx";
  if (["TAHVIL", "BOND", "O/N", "GOV"].some((k) => s.includes(k))) return "bond";
  if (["ALTIN", "GOLD", "PETROL", "OIL", "GC=F"].some((k) => s.includes(k))) return "commodity";
  return "equity";
}

export interface StressInput {
  weights: Record<string, number>;
  scenario?: string;
}

export function stressTest(inp: StressInput) {
  const scenarioName = inp.scenario ?? "bist_crash";
  const scenario = SCENARIOS[scenarioName] ?? SCENARIOS.bist_crash;
  const details: Record<string, { class: string; shock: number; impact: number }> = {};
  let total = 0;
  for (const [sym, w] of Object.entries(inp.weights)) {
    const cls = classify(sym);
    const shock = scenario[cls] ?? -0.1;
    const impact = w * shock;
    details[sym] = { class: cls, shock, impact };
    total += impact;
  }
  return { scenario: scenarioName, scenario_shocks: scenario, portfolio_impact: total, details };
}

// ---------- Backtest ----------
export interface BacktestInput {
  series: Record<string, number[]>;
  weights: Record<string, number>;
  initial_cash?: number;
}

export function backtest(inp: BacktestInput) {
  const names = Object.keys(inp.series);
  if (!names.length) throw new Error("veri yok");
  const cash = inp.initial_cash ?? 100000;
  const minLen = Math.min(...names.map((nm) => inp.series[nm].length));
  const retMat: Record<string, number[]> = {};
  for (const nm of names) {
    const p = inp.series[nm].slice(-minLen);
    retMat[nm] = p.slice(1).map((v, i) => (v - p[i]) / p[i]);
  }
  const T = Math.min(...names.map((nm) => retMat[nm].length));
  const portRets = new Array(T).fill(0);
  for (const nm of names) {
    const w = inp.weights[nm] ?? 0;
    for (let t = 0; t < T; t++) portRets[t] += w * retMat[nm][t];
  }
  const metrics = riskMetrics({ returns: portRets });
  let cum = 1;
  const equity: number[] = [];
  for (const x of portRets) {
    cum *= 1 + x;
    equity.push(cash * cum);
  }
  return {
    total_return: metrics.total_return,
    annualized_return: metrics.annualized_return,
    annualized_volatility: metrics.annualized_volatility,
    sharpe: metrics.sharpe,
    max_drawdown: metrics.max_drawdown,
    final_equity: equity[equity.length - 1] ?? cash,
    equity_curve: equity,
  };
}