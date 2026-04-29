import { useSyncExternalStore } from "react";

export type Side = "long" | "short";

export type Position = {
  id: string;
  symbol: string;
  side: Side;
  size: number;        // base asset size
  entry: number;
  leverage: number;
  margin: number;      // USDC locked
  openedAt: number;
};

export type OrderRecord = {
  id: string;
  symbol: string;
  side: Side;
  type: "market" | "limit";
  price: number;
  size: number;
  ts: number;
};

type State = {
  balance: number;     // free USDC
  positions: Position[];
  history: OrderRecord[];
};

const KEY = "perp_state_v1";

const initial: State = {
  balance: 10_000,
  positions: [],
  history: [],
};

let state: State = (() => {
  if (typeof localStorage === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) } as State;
  } catch { return initial; }
})();

const listeners = new Set<() => void>();
function emit() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useTradingStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function getState() { return state; }

export function openPosition(p: { symbol: string; side: Side; size: number; price: number; leverage: number }) {
  const notional = p.size * p.price;
  const margin = notional / p.leverage;
  if (margin > state.balance) throw new Error("Insufficient margin");
  // merge with existing same-side position
  const existing = state.positions.find((x) => x.symbol === p.symbol && x.side === p.side);
  let positions: Position[];
  if (existing) {
    const newSize = existing.size + p.size;
    const newEntry = (existing.entry * existing.size + p.price * p.size) / newSize;
    positions = state.positions.map((x) =>
      x.id === existing.id
        ? { ...x, size: newSize, entry: newEntry, margin: existing.margin + margin, leverage: p.leverage }
        : x,
    );
  } else {
    positions = [
      ...state.positions,
      { id: crypto.randomUUID(), symbol: p.symbol, side: p.side, size: p.size, entry: p.price, leverage: p.leverage, margin, openedAt: Date.now() },
    ];
  }
  state = {
    ...state,
    balance: state.balance - margin,
    positions,
    history: [
      { id: crypto.randomUUID(), symbol: p.symbol, side: p.side, type: "market" as const, price: p.price, size: p.size, ts: Date.now() },
      ...state.history,
    ].slice(0, 100),
  };
  emit();
}

export function closePosition(id: string, markPrice: number) {
  const pos = state.positions.find((p) => p.id === id);
  if (!pos) return;
  const pnl = (markPrice - pos.entry) * pos.size * (pos.side === "long" ? 1 : -1);
  state = {
    ...state,
    balance: state.balance + pos.margin + pnl,
    positions: state.positions.filter((p) => p.id !== id),
    history: [
      { id: crypto.randomUUID(), symbol: pos.symbol, side: (pos.side === "long" ? "short" : "long") as Side, type: "market" as const, price: markPrice, size: pos.size, ts: Date.now() },
      ...state.history,
    ].slice(0, 100),
  };
  emit();
}

export function resetAccount() {
  state = initial;
  emit();
}

export function pnl(pos: Position, mark: number) {
  const dir = pos.side === "long" ? 1 : -1;
  const pnlUsd = (mark - pos.entry) * pos.size * dir;
  const pnlPct = (pnlUsd / pos.margin) * 100;
  return { pnlUsd, pnlPct };
}
