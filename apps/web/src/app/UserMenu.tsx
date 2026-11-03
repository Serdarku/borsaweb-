"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export default function UserMenu() {
  const { data: session } = useSession();
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg px-2.5 py-1.5"
      >
        <LogIn size={13} /> Giriş
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-300">
      <span className="hidden sm:inline">{session.user?.name}</span>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-1 text-zinc-500 hover:text-white"
        title="Çıkış"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}