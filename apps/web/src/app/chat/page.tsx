"use client";
import { useState } from "react";

interface Msg { role: "user" | "assistant"; content: string; }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: input }) });
      const data = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "—" }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Hata: ${e?.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">AI Chat</h1>
      <div className="rounded border border-zinc-800 p-4 h-[480px] overflow-y-auto space-y-3 bg-zinc-900">
        {messages.length === 0 && <div className="text-zinc-500 text-sm">Bir soru sorun (örn. "THYAO fiyatı nedir?").</div>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block rounded px-3 py-2 text-sm ${m.role === "user" ? "bg-emerald-700" : "bg-zinc-800"}`}>
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          </div>
        ))}
        {loading && <div className="text-zinc-500 text-sm">Yanıtlanıyor…</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
          placeholder="Mesajınız…"
        />
        <button onClick={send} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded">Gönder</button>
      </div>
    </div>
  );
}