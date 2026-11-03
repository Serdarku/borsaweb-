"""Quant servisi: Monte Carlo, Markowitz, risk metrikleri, stres testi."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# Rotalar Faz 2'de eklenecek:
# POST /monte-carlo
# POST /markowitz
# POST /risk-metrics
# POST /stress-test