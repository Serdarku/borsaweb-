"""Quant servisi: Monte Carlo, Markowitz, risk metrikleri, stres testi, backtest."""
import math
import random
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="BorsaWeb Quant Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "quant"}


# ---------- Models ----------
class SeriesInput(BaseModel):
    prices: List[float]


class MultiSeriesInput(BaseModel):
    series: Dict[str, List[float]]
    risk_free: float = 0.0


class RiskInput(BaseModel):
    returns: List[float]
    weights: Optional[List[float]] = None


class StressInput(BaseModel):
    weights: Dict[str, float]
    scenario: str = "bist_crash"


# ---------- Helpers ----------
def log_returns(prices: List[float]) -> np.ndarray:
    p = np.asarray(prices, dtype=float)
    return np.diff(np.log(p))


def annualize(mu_d: float, sigma_d: float) -> tuple:
    return mu_d * 252, sigma_d * math.sqrt(252)


# ---------- Monte Carlo ----------
class MonteCarloInput(BaseModel):
    prices: List[float]
    days: int = 250
    paths: int = 2500


@app.post("/monte-carlo")
def monte_carlo(inp: MonteCarloInput):
    prices = inp.prices
    if len(prices) < 5:
        return {"error": "yetersiz fiyat verisi"}
    lr = log_returns(prices)
    mu = float(np.mean(lr))
    sigma = float(np.std(lr, ddof=1))
    s0 = float(prices[-1])
    days = inp.days
    n = inp.paths
    rng = np.random.default_rng(42)
    Z = rng.standard_normal((n, days))
    # GBM terminal
    drift = (mu - 0.5 * sigma * sigma)
    # cumulative
    cum = np.cumsum(drift + sigma * Z, axis=1)
    terminals = s0 * np.exp(cum[:, -1])
    # path-wise max drawdown (approx on terminal? compute full)
    paths = s0 * np.exp(np.concatenate([np.zeros((n, 1)), cum], axis=1))
    # max drawdown per path
    peak = np.maximum.accumulate(paths, axis=1)
    dd = (paths - peak) / peak
    maxdd = float(np.mean(np.min(dd, axis=1)))
    pct = lambda q: float(np.percentile(terminals, q))
    var95 = s0 - pct(5)
    cvar95 = float(np.mean(terminals[terminals <= pct(5)])) if np.any(terminals <= pct(5)) else pct(5)
    cvar95 = s0 - cvar95
    # sample paths for chart (10)
    sample = paths[:10].tolist()
    return {
        "current": s0,
        "mu_daily": mu,
        "sigma_daily": sigma,
        "mu_annual": mu * 252,
        "sigma_annual": sigma * math.sqrt(252),
        "days": days,
        "paths": n,
        "bear_5": pct(5),
        "base_50": pct(50),
        "bull_95": pct(95),
        "var95": var95,
        "cvar95": cvar95,
        "expected_terminal": float(np.mean(terminals)),
        "prob_profit": float(np.mean(terminals > s0)),
        "avg_max_drawdown": maxdd,
        "sample_paths": sample,
    }


# ---------- Markowitz ----------
@app.post("/markowitz")
def markowitz(inp: MultiSeriesInput):
    series = inp.series
    names = list(series.keys())
    if len(names) < 2:
        return {"error": "en az 2 varlik gerekli"}
    # align lengths
    minlen = min(len(v) for v in series.values())
    mat = np.array([series[n][-minlen:] for n in names])  # (n, T)
    rets = np.diff(np.log(mat), axis=1)  # (n, T-1)
    mean_ret = np.mean(rets, axis=1) * 252
    cov = np.cov(rets) * 252
    if cov.ndim == 0:
        cov = np.array([[cov]])
    n = len(names)
    rf = inp.risk_free
    best = None
    rng = np.random.default_rng(7)
    N = 10000
    results = []
    for _ in range(N):
        w = rng.random(n)
        w = w / w.sum()
        pr = float(w @ mean_ret)
        pv = float(math.sqrt(w @ cov @ w))
        sharpe = (pr - rf) / pv if pv > 0 else 0.0
        results.append((sharpe, w.copy(), pr, pv))
        if best is None or sharpe > best[0]:
            best = (sharpe, w.copy(), pr, pv)
    # min variance
    minvar = min(results, key=lambda x: x[3])
    # efficient frontier sample
    frontier = sorted(results, key=lambda x: x[3])[:50]
    frontier_pts = [{"vol": r[3], "ret": r[2], "sharpe": r[0]} for r in frontier]
    sharpe, w, pr, pv = best
    minv_sharpe, minv_w, minv_pr, minv_pv = minvar
    return {
        "assets": names,
        "max_sharpe": {
            "weights": {names[i]: float(w[i]) for i in range(n)},
            "expected_return": pr,
            "volatility": pv,
            "sharpe": sharpe,
        },
        "min_variance": {
            "weights": {names[i]: float(minv_w[i]) for i in range(n)},
            "expected_return": minv_pr,
            "volatility": minv_pv,
            "sharpe": minv_sharpe,
        },
        "frontier_sample": frontier_pts,
        "annualized_returns": {names[i]: float(mean_ret[i]) for i in range(n)},
    }


# ---------- Risk metrics ----------
@app.post("/risk-metrics")
def risk_metrics(inp: RiskInput):
    r = np.asarray(inp.returns, dtype=float)
    if len(r) < 2:
        return {"error": "yetersiz veri"}
    total = float(np.prod(1 + r) - 1)
    ann_ret = float(np.mean(r) * 252)
    ann_vol = float(np.std(r, ddof=1) * math.sqrt(252))
    sharpe = ann_ret / ann_vol if ann_vol > 0 else 0.0
    # sortino
    downside = r[r < 0]
    dd_dev = float(np.std(downside, ddof=1) * math.sqrt(252)) if len(downside) > 1 else 0.0
    sortino = ann_ret / dd_dev if dd_dev > 0 else 0.0
    # max drawdown
    cum = np.cumprod(1 + r)
    peak = np.maximum.accumulate(cum)
    drawdowns = (cum - peak) / peak
    maxdd = float(np.min(drawdowns))
    # HHI
    hhi = None
    if inp.weights:
        w = np.asarray(inp.weights, dtype=float)
        w = w / w.sum() if w.sum() > 0 else w
        hhi = float(np.sum(w * w))
    # calmar
    calmar = ann_ret / abs(maxdd) if maxdd != 0 else 0.0
    return {
        "total_return": total,
        "annualized_return": ann_ret,
        "annualized_volatility": ann_vol,
        "sharpe": sharpe,
        "sortino": sortino,
        "max_drawdown": maxdd,
        "calmar": calmar,
        "hhi": hhi,
        "n": len(r),
    }


# ---------- Stress test ----------
SCENARIOS = {
    "bist_crash": {"equity": -0.30, "fx": 0.25, "bond": -0.05, "commodity": -0.10},
    "fx_shock": {"equity": -0.10, "fx": 0.25, "bond": -0.02, "commodity": 0.05},
    "rate_hike": {"equity": -0.15, "fx": 0.10, "bond": -0.12, "commodity": -0.05},
    "stagflation": {"equity": -0.20, "fx": 0.20, "bond": -0.08, "commodity": 0.15},
}


def classify(symbol: str) -> str:
    s = symbol.upper()
    if any(k in s for k in ["USD", "EUR", "FX", "TRY"]):
        return "fx"
    if any(k in s for k in ["BOND", "TAHVIL", "TNZ", "TR"]):
        return "bond"
    if any(k in s for k in ["ALTIN", "GOLD", "PETROL", "OIL", "COMMODITY"]):
        return "commodity"
    return "equity"


@app.post("/stress-test")
def stress_test(inp: StressInput):
    scenario = SCENARIOS.get(inp.scenario, SCENARIOS["bist_crash"])
    impacts = {}
    total = 0.0
    for sym, w in inp.weights.items():
        cls = classify(sym)
        shock = scenario.get(cls, -0.10)
        impact = w * shock
        impacts[sym] = {"class": cls, "shock": shock, "impact": impact}
        total += impact
    return {
        "scenario": inp.scenario,
        "scenario_shocks": scenario,
        "portfolio_impact": total,
        "details": impacts,
    }


# ---------- Backtest ----------
class BacktestInput(BaseModel):
    series: Dict[str, List[float]]
    weights: Dict[str, float]
    initial_cash: float = 100000.0


@app.post("/backtest")
def backtest(inp: BacktestInput):
    series = inp.series
    names = list(series.keys())
    minlen = min(len(v) for v in series.values())
    # returns
    ret_mat = {}
    for n in names:
        p = np.asarray(series[n][-minlen:], dtype=float)
        ret_mat[n] = np.diff(p) / p[:-1]
    T = min(len(v) for v in ret_mat.values())
    # portfolio returns
    port_rets = np.zeros(T)
    for n in names:
        w = inp.weights.get(n, 0.0)
        port_rets += w * ret_mat[n][:T]
    cum = np.cumprod(1 + port_rets)
    equity = inp.initial_cash * cum
    total_ret = float(cum[-1] - 1)
    ann_ret = float(np.mean(port_rets) * 252)
    ann_vol = float(np.std(port_rets, ddof=1) * math.sqrt(252))
    sharpe = ann_ret / ann_vol if ann_vol > 0 else 0.0
    peak = np.maximum.accumulate(cum)
    maxdd = float(np.min((cum - peak) / peak))
    return {
        "total_return": total_ret,
        "annualized_return": ann_ret,
        "annualized_volatility": ann_vol,
        "sharpe": sharpe,
        "max_drawdown": maxdd,
        "final_equity": float(equity[-1]),
        "equity_curve": equity.tolist(),
    }