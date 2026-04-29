import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MARKETS } from "@/lib/markets";
import { useCandles, useMarketStreams } from "@/hooks/useMarketData";
import { priceDigits } from "@/lib/format";
import { MarketList } from "@/components/trading/MarketList";
import { MarketHeader } from "@/components/trading/MarketHeader";
import { PriceChart } from "@/components/trading/PriceChart";
import { OrderBook } from "@/components/trading/OrderBook";
import { TradesList } from "@/components/trading/TradesList";
import { OrderForm } from "@/components/trading/OrderForm";
import { PositionsPanel } from "@/components/trading/PositionsPanel";
import { Toaster } from "@/components/ui/sonner";
import { ConnectWalletButton } from "@/components/trading/ConnectWalletButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: TradingApp,
  head: () => ({
    meta: [
      { title: "BasePerps · Decentralized Perpetuals on Base" },
      { name: "description", content: "Trade crypto perpetual futures on Base with up to 50× leverage. Live order books, deep liquidity." },
    ],
  }),
});

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

function TradingApp() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<typeof INTERVALS[number]>("15m");
  const [side, setSide] = useState<"book" | "trades">("book");

  const market = MARKETS.find((m) => m.symbol === symbol)!;
  const digits = priceDigits(symbol);
  const candles = useCandles(symbol, interval);
  const { depth, trades, ticker } = useMarketStreams(symbol);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="flex items-center gap-6 border-b border-panel-border bg-panel/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-background">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 18 L10 10 L14 14 L20 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm font-bold tracking-tight">
            BASE<span className="text-primary">PERPS</span>
          </div>
        </div>
        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <span className="text-foreground">Trade</span>
          <span className="hover:text-foreground cursor-pointer">Portfolio</span>
          <span className="hover:text-foreground cursor-pointer">Vaults</span>
          <span className="hover:text-foreground cursor-pointer">Leaderboard</span>
          <span className="hover:text-foreground cursor-pointer">Docs</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-panel-border bg-panel/60 px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bid" />
            Base Mainnet · Live
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      <MarketHeader market={market} ticker={ticker} />

      {/* Main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr_280px_280px] gap-px bg-panel-border">
        {/* Market list */}
        <aside className="bg-background">
          <MarketList active={symbol} onSelect={setSymbol} />
        </aside>

        {/* Chart + positions */}
        <section className="flex min-h-0 flex-col bg-background">
          <div className="flex items-center gap-1 border-b border-panel-border px-3 py-1.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] uppercase tracking-wider transition-colors",
                  interval === iv ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {iv}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <PriceChart candles={candles} />
          </div>
          <div className="h-[260px] border-t border-panel-border">
            <PositionsPanel />
          </div>
        </section>

        {/* Order book / trades */}
        <aside className="flex min-h-0 flex-col bg-background">
          <div className="flex border-b border-panel-border">
            <TabBtn active={side === "book"} onClick={() => setSide("book")}>Order Book</TabBtn>
            <TabBtn active={side === "trades"} onClick={() => setSide("trades")}>Trades</TabBtn>
          </div>
          <div className="min-h-0 flex-1">
            {side === "book"
              ? <OrderBook depth={depth} digits={digits} />
              : <TradesList trades={trades} digits={digits} />}
          </div>
        </aside>

        {/* Order form */}
        <aside className="bg-background">
          <OrderForm market={market} mark={ticker?.last ?? candles[candles.length - 1]?.close ?? 0} digits={digits} />
        </aside>
      </div>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 border-b-2 px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors",
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
