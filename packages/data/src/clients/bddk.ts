// BDDK Türk Bankacılık Sektörü verileri (skeleton)
// BDDK verisi PDF/Excel olarak yayinlanir; scraping Faz 1.1'de eklenecek.
// Su an yer tutucu + ham metin donusu.

export interface BddkBankingData {
  period?: string;
  nplRatio?: number;
  capitalAdequacy?: number;
  roe?: number;
  roa?: number;
  loans?: number;
  deposits?: number;
  note: string;
  raw?: string;
}

export async function getBddkBankingData(): Promise<BddkBankingData> {
  return {
    note: "BDDK verisi scraping Faz 1.1'de eklenecek (bddk.org.tr aylik bulten).",
  };
}