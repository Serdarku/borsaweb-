"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await signIn("credentials", { username, password, redirect: false });
    if (res?.error) setErr("Giriş başarısız");
    else router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold text-center">Giriş</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Kullanıcı" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2" />
        {err && <div className="text-rose-400 text-sm">{err}</div>}
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded">Giriş Yap</button>
      </form>
      <div className="text-xs text-zinc-500 text-center">Varsayılan: admin / admin (env ile değiştirin)</div>
    </div>
  );
}