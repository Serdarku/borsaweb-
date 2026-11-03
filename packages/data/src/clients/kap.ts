import { fetchWithRetry, cache, TTL } from "../utils/fetchWithRetry";

export interface KapNotification {
  id?: string;
  title?: string;
  summary?: string;
  publishedAt?: string;
  url?: string;
  company?: string;
  relatedStocks?: string;
  disclosureClass?: string;
  subject?: string;
  disclosureIndex?: number;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export async function getKapNotifications(symbol?: string, limit: number = 20): Promise<KapNotification[]> {
  const key = `kap:notif:${symbol || "all"}:${limit}`;
  const cached = cache.get<KapNotification[]>(key);
  if (cached) return cached;

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const url = "https://www.kap.org.tr/tr/api/disclosure/members/byCriteria";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://www.kap.org.tr/tr/bildirim-sorgu",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        fromDate: fmtDate(start),
        toDate: fmtDate(end),
        mkkMemberOidList: [],
        subjectList: [],
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];
    let items: KapNotification[] = arr.map((x: any) => ({
      id: x.disclosureId,
      title: x.subject || x.summary,
      summary: x.summary,
      publishedAt: x.publishDate,
      url: x.disclosureIndex ? `https://www.kap.org.tr/tr/Bildirim/${x.disclosureIndex}` : undefined,
      company: x.kapTitle,
      relatedStocks: x.relatedStocks,
      disclosureClass: x.disclosureClass,
      subject: x.subject,
      disclosureIndex: x.disclosureIndex,
    }));
    if (symbol) {
      const s = symbol.toUpperCase();
      items = items.filter((it) => (it.relatedStocks || "").toUpperCase().includes(s));
    }
    items = items.slice(0, limit);
    cache.set(key, items, TTL.kap);
    return items;
  } catch (e) {
    return [];
  }
}

export async function getKapInsiderTransactions(limit: number = 20): Promise<any[]> {
  const items = await getKapNotifications(undefined, 200);
  return items
    .filter((it) => it.subject === "Pay Alım Satım Bildirimi" && it.disclosureClass === "DKB")
    .slice(0, limit);
}