// Paylaşılan TypeScript tipleri

export type Symbol = string;

export interface Quote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap?: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: string;
}

export interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Fundamentals {
  pe?: number;
  pb?: number;
  eps?: number;
  dividendYield?: number;
  roe?: number;
  beta?: number;
  marketCap?: number;
  sector?: string;
  industry?: string;
}

export interface PortfolioPosition {
  id: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  currency: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
}