import type { Trade } from "@/hooks/useMarketData";
import { fmtPrice, fmtNum } from "@/lib/format";

export function TradesList({ trades, digits }: { trades: Trade[]; digits: number }) {
  return (
    <div className="flex h-full flex-col font-mono text-[11px]">
      <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 px-3 py-[3px] tabular hover:bg-accent/30">
            <span className={t.isBuyerMaker ? "text-ask" : "text-bid"}>{fmtPrice(t.price, digits)}</span>
            <span className="text-right text-foreground/90">{fmtNum(t.qty, 4)}</span>
            <span className="text-right text-muted-foreground">
              {new Date(t.time).toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
