import { useMemo } from "react";
import type { Depth } from "@/hooks/useMarketData";
import { fmtPrice, fmtNum } from "@/lib/format";

export function OrderBook({ depth, digits }: { depth: Depth; digits: number }) {
  const { bids, asks, max } = useMemo(() => {
    const bids = depth.bids.slice(0, 12);
    const asks = depth.asks.slice(0, 12).reverse();
    const max = Math.max(
      ...bids.map((b) => b.size),
      ...asks.map((a) => a.size),
      1,
    );
    return { bids, asks, max };
  }, [depth]);

  const spread = bids[0] && depth.asks[0] ? depth.asks[0].price - bids[0].price : 0;
  const mid = bids[0] && depth.asks[0] ? (depth.asks[0].price + bids[0].price) / 2 : 0;
  const spreadPct = mid ? (spread / mid) * 100 : 0;

  return (
    <div className="flex h-full flex-col font-mono text-[11px]">
      <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex-1 space-y-px overflow-hidden px-1">
        {asks.map((l, i) => {
          const total = asks.slice(i).reduce((s, x) => s + x.size, 0);
          return (
            <Row key={`a-${l.price}-${i}`} side="ask" price={l.price} size={l.size} total={total} pct={(l.size / max) * 100} digits={digits} />
          );
        })}
      </div>
      <div className="border-y border-panel-border bg-panel/60 px-3 py-2 text-center">
        <span className="text-foreground tabular">{fmtPrice(mid, digits)}</span>
        <span className="ml-2 text-[10px] text-muted-foreground tabular">
          spread {spreadPct.toFixed(3)}%
        </span>
      </div>
      <div className="flex-1 space-y-px overflow-hidden px-1 pt-px">
        {bids.map((l, i) => {
          const total = bids.slice(0, i + 1).reduce((s, x) => s + x.size, 0);
          return (
            <Row key={`b-${l.price}-${i}`} side="bid" price={l.price} size={l.size} total={total} pct={(l.size / max) * 100} digits={digits} />
          );
        })}
      </div>
    </div>
  );
}

function Row({
  side, price, size, total, pct, digits,
}: { side: "bid" | "ask"; price: number; size: number; total: number; pct: number; digits: number }) {
  const color = side === "bid" ? "text-bid" : "text-ask";
  const bg = side === "bid" ? "bg-bid-bg" : "bg-ask-bg";
  return (
    <div className="relative grid grid-cols-3 px-2 py-[2px] tabular">
      <div className={`absolute inset-y-0 right-0 ${bg}`} style={{ width: `${pct}%` }} />
      <span className={`relative ${color}`}>{fmtPrice(price, digits)}</span>
      <span className="relative text-right text-foreground/90">{fmtNum(size, 4)}</span>
      <span className="relative text-right text-muted-foreground">{fmtNum(total, 3)}</span>
    </div>
  );
}
