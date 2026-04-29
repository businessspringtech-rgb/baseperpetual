export function fmtPrice(n: number, digits = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fmtNum(n: number, digits = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
export function fmtCompact(n: number) {
  if (!isFinite(n)) return "—";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}
export function pctClass(n: number) {
  return n >= 0 ? "text-bid" : "text-ask";
}
export function priceDigits(symbol: string) {
  if (symbol.startsWith("BTC")) return 1;
  if (symbol.startsWith("ETH") || symbol.startsWith("SOL") || symbol.startsWith("BNB")) return 2;
  return 4;
}
