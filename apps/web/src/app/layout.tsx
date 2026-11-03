import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: { default: "BorsaWeb — BIST, TEFAS, Kripto & Makro", template: "%s · BorsaWeb" },
  description: "BIST hisseleri, TEFAS fonları, kripto ve makro verileri tek platformda.",
  openGraph: {
    title: "BorsaWeb",
    description: "Birleşik Türkiye finans platformu",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 fade-up">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-xs text-zinc-600">
            BorsaWeb · Veriler: Yahoo Finance · CoinGecko · TCMB · TEFAS · KAP · BDDK · Dünya Bankası — Yatırım tavsiyesi değildir.
          </footer>
        </Providers>
      </body>
    </html>
  );
}