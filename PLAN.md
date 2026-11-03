# BorsaWeb — Faz Planı

## Faz 0 — İskelet (TAMAMLANDI)
- Monorepo (npm workspaces): apps/web, apps/quant, packages/{types,data,ui}
- Next.js 14 (webpack) build OK
- FastAPI quant servisi health OK
- Docker Compose (web, quant, db, redis)
- README, .env.example, PLAN

## Faz 1 — TS Data Layer
- packages/data: Yahoo Finance, CoinGecko, Frankfurter FX, TCMB XML, TEFAS, KAP, BDDK, EVDS istemcileri
- Cache (TTL), retry (exponential backoff + jitter), circuit breaker (host bazlı)
- getDataHealth

## Faz 2 — Quant Servisi
- Monte Carlo (GBM, 2500 patika, VaR/CVaR, ayı/boğa)
- Markowitz (10k portföy, optimal Sharpe ağırlıkları)
- Risk metrikleri (Sharpe, Sortino, MaxDD, Alfa, HHI)
- Stres testi (BIST çöküşü, kur şoku, faiz artışı, stagflasyon)
- Portföy backtest

## Faz 3 — Frontend: Dashboard + Hisse Detay
- Dashboard: BIST100, kurlar, altın, VIX, movers, trending, watchlist
- Hisse Detay: fiyat, fundamentals, teknik göstergeler, OHLC grafik, haberler, analist konsensüsü, temettü, kazanç, profil, karşılaştırma

## Faz 4 — Portföy + Watchlist + DB
- Pozisyon CRUD, değer/ağırlıklar/sektör kırılımı
- Risk metrikleri, Monte Carlo/Markowitz/stres testi entegrasyonu
- Watchlist kalıcı kaydetme
- PostgreSQL + Prisma/Drizzle

## Faz 5 — AI Chat
- Multi-agent (planning/action/validation/answer), tool calling
- Streaming SSE, conversation history
- Grafik üretimi (OHLC tablosu)

## Faz 6 — Fonlar + Makro + Kripto sayfaları
## Faz 7 — Auth (çoklu kullanıcı) + VPS deploy
## Faz 8 — APK (Capacitor / PWA)