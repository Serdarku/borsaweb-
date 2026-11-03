"use client";
import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Card, CardBody, Input, Button, Badge } from "@/components/ui";

interface Msg { role: "user" | "assistant"; content: string; }

const EXAMPLES = [
  { icon: "📊", label: "Hisse fiyatı", q: "THYAO fiyatı ne kadar?" },
  { icon: "📈", label: "Karşılaştırma", q: "GARAN AKBNK VAKBN fiyatları" },
  { icon: "🔍", label: "Temel analiz", q: "ASELS hakkında bilgi" },
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const data = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "—" }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Hata: ${e?.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Asistan</h1>
          <p className="text-sm text-zinc-500 mt-1">Fiyat verisiyle desteklenen Türkçe finans asistanı</p>
        </div>
        <Badge variant={loading ? "info" : "default"}>{loading ? "Çalışıyor…" : "Hazır"}</Badge>
      </div>

      <Card className="h-[540px] flex flex-col">
        <CardBody className="flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <Bot size={32} className="text-emerald-400" />
              <div className="text-sm text-zinc-400">Bir soru sorun veya hızlı başlangıç seçin</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLES.map((e) => (
                  <button key={e.label} onClick={() => send(e.q)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs hover:border-emerald-500/40 hover:bg-zinc-800">
                    <span className="mr-1.5">{e.icon}</span>{e.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <span className="mt-1.5 text-emerald-400"><Bot size={16} /></span>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-zinc-800/80 border border-zinc-800/60"}`}>
                {m.content}
              </div>
              {m.role === "user" && <span className="mt-1.5 text-zinc-400"><User size={16} /></span>}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400"><Bot size={16} /></span>
              <div className="bg-zinc-800/80 rounded-2xl px-4 py-2.5 text-sm text-zinc-500">Düşünüyor…</div>
            </div>
          )}
        </CardBody>
        <div className="border-t border-zinc-800/60 p-3 flex gap-2">
          <Input value={input} onChange={(e: any) => setInput(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && send("")} placeholder="Örn: THYAO GARAN fiyatları…" className="flex-1" />
          <Button onClick={() => send("")} disabled={loading}><Send size={14} /></Button>
        </div>
      </Card>
    </div>
  );
}