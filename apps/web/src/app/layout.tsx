import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BorsaWeb",
  description: "Birleşik Türkiye finans platformu",
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/hisse/THYAO", label: "Hisse" },
  { href: "/portfoy", label: "Portföy" },
  { href: "/fonlar", label: "Fonlar" },
  { href: "/makro", label: "Makro" },
  { href: "/bddk", label: "BDDK" },
  { href: "/evds", label: "EVDS" },
  { href: "/kripto", label: "Kripto" },
  { href: "/chat", label: "AI Chat" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <Providers>
          <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-6">
            <span className="font-bold text-lg text-emerald-400">BorsaWeb</span>
            <nav className="flex gap-4 text-sm text-zinc-300">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="hover:text-white">
                  {n.label}
                </a>
              ))}
            </nav>
          </header>
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}