# BorsaWeb — Birleşik Türkiye Finans Platformu

BIST, TEFAS, kripto, makro, portföy ve AI asistanı tek çatı altında toplayan web uygulaması.
4 açık kaynak finans projesinin (finans-mcp, Finance-MCP, burkut-mcp, borsaci) en verimli parçaları birleştirilmiştir.

## Stack
- Frontend + Backend: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Veri katmanı: `packages/data` — Yahoo Finance, CoinGecko, TCMB, TEFAS, KAP, BDDK, Dünya Bankası
- Analiz/Quant: **saf TypeScript** (`apps/web/src/lib/quant.ts`) — Monte Carlo, Markowitz, risk metrikleri, stres testi, backtest (API route olarak sunulan, ek sunucu gerekmez)
- Auth: NextAuth
- Deploy: **Vercel** (önerilen) veya Docker Compose (VPS)

## 🚀 Vercel'e Dağıtım (önerilen)

1. **Vercel**'e GitHub hesabınızla giriş yapın → **Add New → Project**.
2. `Serdarku/cagran.com.tr` (veya `Serdarku/borsaweb-`) reposunu seçin.
3. **Framework Preset:** `Next.js` otomatik algılanır.
4. **Root Directory:** `apps/web` olarak ayarlayın (monorepo olduğu için önemli).
5. **Build Command:** `npm run build` · **Output:** otomatik.
6. **Environment Variables** ekleyin (Project Settings → Environment Variables):
   - `AUTH_SECRET` → `openssl rand -base64 32` çıktısı
   - `AUTH_USERNAME` / `AUTH_PASSWORD` → giriş bilgileri
   - `NEXT_PUBLIC_APP_URL` → `https://cagran.com.tr`
   - `OPENROUTER_API_KEY` veya `GEMINI_API_KEY` → (opsiyonel, AI Chat için)
   - `EVDS_API_KEY` → (opsiyonel, EVDS sayfası için)
7. **Deploy**'a basın. GitHub'a her `git push`'ta otomatik yeniden yayınlanır.
8. **Domain:** Settings → Domains → `cagran.com.tr` ekleyin (DNS'i Vercel'e yönlendirin veya CNAME verin).

> Python `apps/quant` sunucusu artık **kullanılmıyor** — tüm hesaplar tarayıcı/sunucu tarafında TypeScript ile yapılıyor, böylece Vercel'de tek uygulama olarak çalışır.

## Yerel Geliştirme
```bash
cd apps/web
npm install
cp ../../.env.example ../../.env   # değişkenleri doldurun
npm run dev                          # http://localhost:3000
```

## Docker ile (VPS alternatifi)
```bash
cp .env.example .env   # doldurun
docker compose up -d --build   # sadece web (+ isteğe bağlı db/redis)
```

## APK (Capacitor)
```bash
cd apps/web
# 1) Siteyi Vercel'e deploy edin ve URL'i ayarlayın
set CAPACITOR_SERVER_URL=https://cagran.com.tr
# 2) Android projesini senkronize edin
npm run cap:sync
# 3) Android Studio ile açıp APK oluşturun
npm run cap:open:android
```
Not: Android Studio ve Android SDK kurulu olmalıdır.

## Faz Planı
Faz 0 iskelet tamamlandı. Detaylar: PLAN.md