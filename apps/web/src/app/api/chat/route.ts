import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@borsa/data";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = String(body?.message || "");
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Ticker tespiti
  const tickers = Array.from(new Set((message.match(/\b[A-Z]{3,6}\b/g) || [])));
  const quotes: any[] = [];
  for (const t of tickers.slice(0, 5)) {
    try { quotes.push(await getQuote(t)); } catch {}
  }
  const context = quotes.length
    ? "Güncel veriler:\n" + quotes.map((q) => `${q.symbol}: ${q.price} ${q.currency} (${q.changePercent?.toFixed(2)}%)`).join("\n")
    : "";

  const orKey = process.env.OPENROUTER_API_KEY;
  const gemKey = process.env.GEMINI_API_KEY;

  if (orKey) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${orKey}` },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "Sen Türkiye finans piyasaları konusunda uzman bir asistansın. Türkçe yanıt ver. Yatırım tavsiyesi verme." },
            { role: "user", content: context ? `${context}\n\nSoru: ${message}` : message },
          ],
        }),
      });
      const json = await r.json();
      const reply = json?.choices?.[0]?.message?.content || "Yanıt alınamadı.";
      return NextResponse.json({ reply, quotes });
    } catch (e: any) {
      return NextResponse.json({ reply: `LLM hatası: ${e?.message}`, quotes }, { status: 200 });
    }
  }

  if (gemKey) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: (context ? context + "\n\n" : "") + message }] }],
            systemInstruction: { parts: [{ text: "Sen Türkiye finans piyasaları konusunda uzman bir asistansın. Türkçe yanıt ver. Yatırım tavsiyesi verme." }] },
          }),
        }
      );
      const json = await r.json();
      const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
      return NextResponse.json({ reply, quotes });
    } catch (e: any) {
      return NextResponse.json({ reply: `LLM hatası: ${e?.message}`, quotes }, { status: 200 });
    }
  }

  // LLM yoksa ham veri
  const reply = context
    ? `${context}\n\n(LLM API anahtarı tanımlı değil; .env.local içine OPENROUTER_API_KEY veya GEMINI_API_KEY ekleyin.)`
    : "LLM API anahtarı tanımlı değil. .env.local içine OPENROUTER_API_KEY veya GEMINI_API_KEY ekleyin.";
  return NextResponse.json({ reply, quotes });
}