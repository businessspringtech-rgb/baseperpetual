import { useEffect, useRef, useState } from "react";

export type Ticker = {
  symbol: string;
  last: number;
  change: number;     // 24h pct
  high: number;
  low: number;
  volume: number;     // base
  quoteVolume: number;
};

export type DepthLevel = { price: number; size: number };
export type Depth = { bids: DepthLevel[]; asks: DepthLevel[] };
export type Trade = { id: number; price: number; qty: number; time: number; isBuyerMaker: boolean };

const REST = "https://api.binance.com";
const WS = "wss://stream.binance.com:9443/stream";

/** Tickers for many symbols at once (for the market list). */
export function useAllTickers(symbols: string[]) {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    let stop = false;
    const set = new Set(symbols);
    fetch(`${REST}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (stop) return;
        const next: Record<string, Ticker> = {};
        for (const r of rows) {
          next[r.symbol] = {
            symbol: r.symbol,
            last: +r.lastPrice,
            change: +r.priceChangePercent,
            high: +r.highPrice,
            low: +r.lowPrice,
            volume: +r.volume,
            quoteVolume: +r.quoteVolume,
          };
        }
        setTickers(next);
      })
      .catch(() => {});

    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`${WS}?streams=${streams}`);
    ws.onmessage = (e) => {
      try {
        const { data } = JSON.parse(e.data);
        if (!data || !set.has(data.s)) return;
        setTickers((prev) => ({
          ...prev,
          [data.s]: {
            symbol: data.s,
            last: +data.c,
            change: +data.P,
            high: +data.h,
            low: +data.l,
            volume: +data.v,
            quoteVolume: +data.q,
          },
        }));
      } catch {}
    };
    return () => { stop = true; ws.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  return tickers;
}

/** Live order book + trades for a single symbol. */
export function useMarketStreams(symbol: string) {
  const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);

  useEffect(() => {
    let stop = false;
    setDepth({ bids: [], asks: [] });
    setTrades([]);

    fetch(`${REST}/api/v3/depth?symbol=${symbol}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        setDepth({
          bids: (d.bids ?? []).map((b: string[]) => ({ price: +b[0], size: +b[1] })),
          asks: (d.asks ?? []).map((b: string[]) => ({ price: +b[0], size: +b[1] })),
        });
      });

    fetch(`${REST}/api/v3/trades?symbol=${symbol}&limit=30`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (stop) return;
        setTrades(
          rows.reverse().map((t) => ({
            id: t.id, price: +t.price, qty: +t.qty, time: t.time, isBuyerMaker: t.isBuyerMaker,
          })),
        );
      });

    const s = symbol.toLowerCase();
    const ws = new WebSocket(
      `${WS}?streams=${s}@depth20@100ms/${s}@aggTrade/${s}@ticker`,
    );
    ws.onmessage = (e) => {
      try {
        const { stream, data } = JSON.parse(e.data);
        if (!stream) return;
        if (stream.endsWith("@depth20@100ms")) {
          setDepth({
            bids: data.bids.map((b: string[]) => ({ price: +b[0], size: +b[1] })),
            asks: data.asks.map((b: string[]) => ({ price: +b[0], size: +b[1] })),
          });
        } else if (stream.endsWith("@aggTrade")) {
          setTrades((prev) => {
            const t: Trade = {
              id: data.a, price: +data.p, qty: +data.q, time: data.T, isBuyerMaker: data.m,
            };
            return [t, ...prev].slice(0, 40);
          });
        } else if (stream.endsWith("@ticker")) {
          setTicker({
            symbol: data.s, last: +data.c, change: +data.P,
            high: +data.h, low: +data.l, volume: +data.v, quoteVolume: +data.q,
          });
        }
      } catch {}
    };

    return () => { stop = true; ws.close(); };
  }, [symbol]);

  return { depth, trades, ticker };
}

/** Candles (REST snapshot + live kline updates). */
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function useCandles(symbol: string, interval = "15m") {
  const [candles, setCandles] = useState<Candle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    setCandles([]);
    fetch(`${REST}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (stop) return;
        setCandles(
          rows.map((k) => ({
            time: Math.floor(k[0] / 1000),
            open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5],
          })),
        );
      });

    const ws = new WebSocket(`${WS}?streams=${symbol.toLowerCase()}@kline_${interval}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const { data } = JSON.parse(e.data);
        const k = data?.k;
        if (!k) return;
        const c: Candle = {
          time: Math.floor(k.t / 1000),
          open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v,
        };
        setCandles((prev) => {
          if (!prev.length) return [c];
          const last = prev[prev.length - 1];
          if (last.time === c.time) {
            const next = prev.slice(0, -1);
            next.push(c);
            return next;
          }
          if (c.time > last.time) return [...prev, c].slice(-500);
          return prev;
        });
      } catch {}
    };
    return () => { stop = true; ws.close(); };
  }, [symbol, interval]);

  return candles;
}
