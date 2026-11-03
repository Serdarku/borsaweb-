"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();
  if (!session) {
    return (
      <button onClick={() => signIn()} className="text-sm text-zinc-300 hover:text-white">
        Giriş
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-300">
      <span>{session.user?.name}</span>
      <button onClick={() => signOut()} className="hover:text-white">Çıkış</button>
    </div>
  );
}