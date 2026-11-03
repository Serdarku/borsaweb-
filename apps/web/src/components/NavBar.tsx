"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { TrendingUp, Search } from "lucide-react";
import { cn } from "@/components/ui";
import UserMenu from "@/app/UserMenu";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/portfoy", label: "Portföy" },
  { href: "/fonlar", label: "Fonlar" },
  { href: "/makro", label: "Makro" },
  { href: "/bddk", label: "BDDK" },
  { href: "/evds", label: "EVDS" },
  { href: "/kripto", label: "Kripto" },
  { href: "/chat", label: "AI Chat" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const s = q.trim().toUpperCase();
    if (s) router.push(`/hisse/${s}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex h-14 shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-emerald-400">
            <TrendingUp size={20} />
            <span className="hidden sm:inline">BorsaWeb</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto py-3 text-sm [scrollbar-width:none]">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors",
                  active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <form onSubmit={onSearch} className="relative hidden lg:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hisse ara…"
              className="w-40 rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-7 pr-2 text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </form>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}