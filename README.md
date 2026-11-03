# BorsaWeb — Birleşik Türkiye Finans Platformu

BIST, TEFAS, kripto, makro, portföy ve AI asistanı tek çatı altında toplayan web uygulaması.
4 açık kaynak finans projesinin (finans-mcp, Finance-MCP, burkut-mcp, borsaci) en verimli parçaları birleştirilmiştir.

## Stack
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind
- Backend (TS): Next.js API routes + paylaşılan data layer (`packages/data`)
- Quant servisi: FastAPI + numpy/pandas/scipy (Monte Carlo, Markowitz, risk, stres testi)
- DB: PostgreSQL, Cache: Redis
- Deploy: Docker Compose (tek VPS)

## Hızlı Başlangıç (geliştirme)
```bash
# Web
cd apps/web && npm install && npm run dev   # http://localhost:3000

# Quant
cd apps/quant && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

## Docker ile
```bash
docker compose up -d --build
```

## Faz Planı
Faz 0 iskelet tamamlandı. Sonraki: Faz 1 data layer, Faz 2 quant, Faz 3 frontend sayfaları, ...
Detaylar: PLAN.md