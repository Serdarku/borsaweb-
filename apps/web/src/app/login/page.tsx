"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Card, CardBody, Input, Button } from "@/components/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) setErr("Kullanıcı adı veya şifre hatalı");
    else router.push("/");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-5 pt-8">
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-3"><TrendingUp size={24} /></span>
            <h1 className="text-xl font-bold">BorsaWeb</h1>
            <p className="text-xs text-zinc-500 mt-1">Devam etmek için giriş yapın</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder="Kullanıcı adı" autoFocus />
            <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Şifre" />
            {err && <div className="text-sm text-rose-400">{err}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Giriş yapılıyor…" : "Giriş Yap"}</Button>
          </form>
          <div className="text-[11px] text-zinc-600 text-center">Demo giriş: <code>admin / admin</code> · production'da .env ile değiştirin</div>
        </CardBody>
      </Card>
    </div>
  );
}