import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { openPosition, useTradingStore } from "@/lib/trading-store";
import type { Market } from "@/lib/markets";
import { fmtPrice } from "@/lib/format";
import { toast } from "sonner";

export function OrderForm({ market, mark, digits }: { market: Market; mark: number; digits: number }) {
  const balance = useTradingStore((s) => s.balance);
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(10);
  const [pct, setPct] = useState(10);

  const margin = (balance * pct) / 100;
  const notional = margin * leverage;
  const size = mark > 0 ? notional / mark : 0;
  const liq = useMemo(() => {
    if (!mark || !leverage) return 0;
    const dir = side === "long" ? -1 : 1;
    return mark * (1 + dir * (1 / leverage) * 0.95);
  }, [mark, leverage, side]);

  const submit = () => {
    if (mark <= 0) return toast.error("Waiting for price feed");
    if (margin <= 0) return toast.error("Increase order size");
    try {
      openPosition({ symbol: market.symbol, side, size, price: mark, leverage });
      toast.success(`${side.toUpperCase()} ${size.toFixed(4)} ${market.base} @ ${fmtPrice(mark, digits)}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to open position");
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-panel-border">
        <button
          onClick={() => setSide("long")}
          className={cn(
            "py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            side === "long" ? "bg-bid text-background" : "text-muted-foreground hover:bg-accent/40",
          )}
        >
          Long / Buy
        </button>
        <button
          onClick={() => setSide("short")}
          className={cn(
            "py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            side === "short" ? "bg-ask text-background" : "text-muted-foreground hover:bg-accent/40",
          )}
        >
          Short / Sell
        </button>
      </div>

      <Field label="Available">
        <span className="tabular text-foreground">{fmtPrice(balance, 2)} <span className="text-muted-foreground">USDC</span></span>
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Leverage</span>
          <span className="tabular text-primary">{leverage}×</span>
        </div>
        <Slider value={[leverage]} min={1} max={market.maxLev} step={1} onValueChange={(v) => setLeverage(v[0])} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Margin</span>
          <span className="tabular">{pct}%</span>
        </div>
        <Slider value={[pct]} min={1} max={100} step={1} onValueChange={(v) => setPct(v[0])} />
        <div className="grid grid-cols-4 gap-1">
          {[10, 25, 50, 100].map((p) => (
            <button
              key={p}
              onClick={() => setPct(p)}
              className="rounded border border-panel-border py-1 text-[10px] text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <Field label="Order Price">
        <Input value={fmtPrice(mark, digits)} readOnly className="h-8 border-panel-border bg-panel text-right font-mono text-xs tabular" />
      </Field>

      <div className="space-y-1 rounded-md border border-panel-border bg-panel/60 p-2 text-[11px]">
        <Row label="Size" value={`${size.toFixed(5)} ${market.base}`} />
        <Row label="Margin" value={`${margin.toFixed(2)} USDC`} />
        <Row label="Notional" value={`${notional.toFixed(2)} USDC`} />
        <Row label="Est. Liq. Price" value={fmtPrice(liq, digits)} mono />
      </div>

      <button
        onClick={submit}
        className={cn(
          "mt-auto rounded-md py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90",
          side === "long" ? "bg-bid text-background" : "bg-ask text-background",
        )}
      >
        {side === "long" ? "Open Long" : "Open Short"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "tabular")}>{value}</span>
    </div>
  );
}
