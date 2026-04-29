import { useState } from "react";
import { closePosition, pnl, useTradingStore, type Position } from "@/lib/trading-store";
import { fmtPrice, fmtNum, priceDigits } from "@/lib/format";
import { useAllTickers } from "@/hooks/useMarketData";
import { MARKETS } from "@/lib/markets";
import { cn } from "@/lib/utils";

type Tab = "positions" | "history";

export function PositionsPanel() {
  const [tab, setTab] = useState<Tab>("positions");
  const positions = useTradingStore((s) => s.positions);
  const history = useTradingStore((s) => s.history);
  const tickers = useAllTickers(MARKETS.map((m) => m.symbol));

  const totalPnl = positions.reduce((s, p) => {
    const mark = tickers[p.symbol]?.last ?? p.entry;
    return s + pnl(p, mark).pnlUsd;
  }, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-panel-border px-2">
        <TabBtn active={tab === "positions"} onClick={() => setTab("positions")}>
          Positions <span className="ml-1 text-muted-foreground">({positions.length})</span>
        </TabBtn>
        <TabBtn active={tab === "history"} onClick={() => setTab("history")}>
          Trade History
        </TabBtn>
        <div className="ml-auto pr-3 text-[11px] text-muted-foreground">
          Unrealized PnL{" "}
          <span className={cn("tabular", totalPnl >= 0 ? "text-bid" : "text-ask")}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} USDC
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "positions" ? (
          positions.length === 0 ? (
            <Empty>No open positions</Empty>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-panel-border">
                  <Th>Market</Th><Th>Side</Th><Th>Size</Th><Th>Entry</Th><Th>Mark</Th>
                  <Th>Liq.</Th><Th>Margin</Th><Th>PnL</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => <PositionRow key={p.id} pos={p} mark={tickers[p.symbol]?.last ?? p.entry} />)}
              </tbody>
            </table>
          )
        ) : history.length === 0 ? (
          <Empty>No trades yet</Empty>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-panel-border">
                <Th>Time</Th><Th>Market</Th><Th>Side</Th><Th>Type</Th><Th>Price</Th><Th>Size</Th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-panel-border/50 hover:bg-accent/20">
                  <Td className="text-muted-foreground">{new Date(h.ts).toLocaleTimeString()}</Td>
                  <Td>{h.symbol.replace("USDT", "-PERP")}</Td>
                  <Td className={h.side === "long" ? "text-bid" : "text-ask"}>{h.side.toUpperCase()}</Td>
                  <Td className="text-muted-foreground">{h.type}</Td>
                  <Td className="tabular">{fmtPrice(h.price, priceDigits(h.symbol))}</Td>
                  <Td className="tabular">{fmtNum(h.size, 5)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PositionRow({ pos, mark }: { pos: Position; mark: number }) {
  const digits = priceDigits(pos.symbol);
  const { pnlUsd, pnlPct } = pnl(pos, mark);
  const dir = pos.side === "long" ? -1 : 1;
  const liq = pos.entry * (1 + dir * (1 / pos.leverage) * 0.95);
  return (
    <tr className="border-b border-panel-border/50 hover:bg-accent/20">
      <Td className="font-medium">{pos.symbol.replace("USDT", "-PERP")}</Td>
      <Td>
        <span className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
          pos.side === "long" ? "bg-bid-bg text-bid" : "bg-ask-bg text-ask",
        )}>
          {pos.side} {pos.leverage}×
        </span>
      </Td>
      <Td className="tabular">{fmtNum(pos.size, 5)}</Td>
      <Td className="tabular">{fmtPrice(pos.entry, digits)}</Td>
      <Td className="tabular">{fmtPrice(mark, digits)}</Td>
      <Td className="tabular text-muted-foreground">{fmtPrice(liq, digits)}</Td>
      <Td className="tabular">{pos.margin.toFixed(2)}</Td>
      <Td className={cn("tabular", pnlUsd >= 0 ? "text-bid" : "text-ask")}>
        {pnlUsd >= 0 ? "+" : ""}{pnlUsd.toFixed(2)}
        <span className="ml-1 text-[10px] opacity-70">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
      </Td>
      <Td>
        <button
          onClick={() => closePosition(pos.id, mark)}
          className="rounded border border-panel-border px-2 py-0.5 text-[10px] uppercase tracking-wider hover:bg-accent/60"
        >
          Close
        </button>
      </Td>
    </tr>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => <th className="px-3 py-2 text-left font-normal">{children}</th>;
const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("px-3 py-2", className)}>{children}</td>
);
const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-3 py-2 text-xs font-medium transition-colors",
      active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full items-center justify-center py-12 text-xs text-muted-foreground">{children}</div>
);
