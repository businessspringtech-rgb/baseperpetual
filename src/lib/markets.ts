export type Market = {
  symbol: string;   // e.g. BTCUSDT
  base: string;     // BTC
  label: string;    // BTC-PERP
  maxLev: number;
};

export const MARKETS: Market[] = [
  { symbol: "BTCUSDT",  base: "BTC",  label: "BTC-PERP",  maxLev: 50 },
  { symbol: "ETHUSDT",  base: "ETH",  label: "ETH-PERP",  maxLev: 50 },
  { symbol: "SOLUSDT",  base: "SOL",  label: "SOL-PERP",  maxLev: 25 },
  { symbol: "BNBUSDT",  base: "BNB",  label: "BNB-PERP",  maxLev: 25 },
  { symbol: "ARBUSDT",  base: "ARB",  label: "ARB-PERP",  maxLev: 20 },
  { symbol: "OPUSDT",   base: "OP",   label: "OP-PERP",   maxLev: 20 },
  { symbol: "AVAXUSDT", base: "AVAX", label: "AVAX-PERP", maxLev: 20 },
  { symbol: "LINKUSDT", base: "LINK", label: "LINK-PERP", maxLev: 20 },
  { symbol: "DOGEUSDT", base: "DOGE", label: "DOGE-PERP", maxLev: 20 },
  { symbol: "AAVEUSDT", base: "AAVE", label: "AAVE-PERP", maxLev: 20 },
];
