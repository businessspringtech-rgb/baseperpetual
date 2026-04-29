import { MARKETS } from "@/lib/markets";
import { useAllTickers } from "@/hooks/useMarketData";
import { fmtPrice, fmtCompact, priceDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MarketList({
  active, onSelect,
}: { active: string; onSelect: (sym: string) => void }) {
  const tickers = useAllTickers(MARKETS.map((m) => m.symbol));

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Market</span>
        <span className="text-right">Last</span>
        <span className="text-right w-16">24h</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MARKETS.map((m) => {
          const t = tickers[m.symbol];
          const isActive = m.symbol === active;
          const ch = t?.change ?? 0;
          return (
            <button
              key={m.symbol}
              onClick={() => onSelect(m.symbol)}
              className={cn(
                "grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/40",
                isActive && "bg-accent/60",
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{m.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  Vol {t ? fmtCompact(t.quoteVolume) : "—"}
                </div>
              </div>
              <div className="text-right tabular text-foreground">
                {t ? fmtPrice(t.last, priceDigits(m.symbol)) : "—"}
              </div>
              <div
                className={cn(
                  "w-16 text-right tabular text-[11px]",
                  ch >= 0 ? "text-bid" : "text-ask",
                )}
              >
                {t ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` : "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
