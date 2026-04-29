import { useTradingStore, resetAccount } from "@/lib/trading-store";
import type { Market } from "@/lib/markets";
import type { Ticker } from "@/hooks/useMarketData";
import { fmtPrice, fmtCompact, priceDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MarketHeader({ market, ticker }: { market: Market; ticker: Ticker | null }) {
  const balance = useTradingStore((s) => s.balance);
  const digits = priceDigits(market.symbol);
  const ch = ticker?.change ?? 0;

  return (
    <div className="flex items-center gap-6 border-b border-panel-border bg-panel/40 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold tracking-tight text-primary">
          {market.base.slice(0, 3)}
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">{market.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Perpetual · Base</div>
        </div>
      </div>

      <Stat label="Mark Price" value={ticker ? fmtPrice(ticker.last, digits) : "—"} accent />
      <Stat
        label="24h Change"
        value={ticker ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` : "—"}
        valueClass={ch >= 0 ? "text-bid" : "text-ask"}
      />
      <Stat label="24h High" value={ticker ? fmtPrice(ticker.high, digits) : "—"} />
      <Stat label="24h Low" value={ticker ? fmtPrice(ticker.low, digits) : "—"} />
      <Stat label="24h Volume" value={ticker ? `$${fmtCompact(ticker.quoteVolume)}` : "—"} />
      <Stat label="Funding" value="0.0042%" valueClass="text-bid" />

      <div className="ml-auto flex items-center gap-3">
        <div className="rounded-md border border-panel-border bg-panel px-3 py-1.5 text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Account</div>
          <div className="tabular text-sm font-semibold text-foreground">${fmtPrice(balance, 2)}</div>
        </div>
        <button
          onClick={resetAccount}
          className="rounded-md border border-panel-border px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Stat({
  label, value, valueClass, accent,
}: { label: string; value: string; valueClass?: string; accent?: boolean }) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("tabular text-sm font-semibold", accent && "text-primary", valueClass)}>{value}</div>
    </div>
  );
}
