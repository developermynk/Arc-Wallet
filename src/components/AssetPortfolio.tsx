"use client";

import { useArcWallet } from "@/contexts/ArcWalletProvider";

export function AssetPortfolio() {
  const { address, erc20Balances } = useArcWallet();

  const shortened = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0x0000...0000";

  const initialMap: Record<string, string> = { USDC: "UC", EURC: "EU" };

  // deduplicate erc20Balances by symbol
  const seen = new Map<string, (typeof erc20Balances)[number]>();
  for (const t of erc20Balances) seen.set(t.symbol, t);

  const assets = Array.from(seen.values())
    .filter((t) => parseFloat(t.balance) > 0)
    .map((t) => {
      const usdValue = parseFloat(t.balance) * t.priceUsd;
      const change24h = t.priceUsd24hAgo > 0
        ? ((t.priceUsd - t.priceUsd24hAgo) / t.priceUsd24hAgo) * 100
        : 0;
      const isUp = change24h >= 0;
      const sparkColor = isUp ? "#22c55e" : "#ef4444";

      return {
        initials: initialMap[t.symbol] || t.symbol.slice(0, 2).toUpperCase(),
        name: t.symbol,
        address: shortened,
        balanceStr: `${parseFloat(t.balance).toFixed(4)} ${t.symbol}`,
        value: `$${usdValue.toFixed(2)}`,
        change24h,
        sparkColor,
      };
    });

  return (
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold mb-3 text-white">Asset Portfolio</h2>

      <div className="grid grid-cols-[1fr_1.2fr_1.2fr_auto_auto] gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-white/5">
        <span>Asset</span>
        <span>Address</span>
        <span>Balance</span>
        <span>Value</span>
        <span>24h</span>
      </div>

      <div className="flex flex-col">
        {assets.map((asset, i) => (
          <div
            key={`asset-${asset.name}-${i}`}
            className="grid grid-cols-[1fr_1.2fr_1.2fr_auto_auto] gap-3 px-3 py-3 text-sm transition-colors hover:bg-white/5 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                {asset.initials}
              </div>
              <span className="font-medium text-white text-sm">{asset.name}</span>
            </div>
            <span className="text-gray-400 font-mono text-xs self-center">
              {asset.address}
            </span>
            <span className="text-gray-300 self-center text-sm">{asset.balanceStr}</span>
            <span className="text-white font-medium self-center text-sm">{asset.value}</span>
            <span
              className="self-center text-sm font-medium"
              style={{ color: asset.sparkColor }}
            >
              {asset.change24h >= 0 ? "+" : ""}{asset.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
