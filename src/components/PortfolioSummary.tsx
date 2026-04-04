"use client";

import { PieChart, Pie, ResponsiveContainer, Cell } from "recharts";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { useState } from "react";

const COLOR_MAP: Record<string, string> = {
  USDC: "#2563EB",
  EURC: "#059669",
};

export function PortfolioSummary() {
  const { balance, isConnected, erc20Balances } = useArcWallet();
  const [hovered, setHovered] = useState<number | null>(null);

  const bal = isConnected && balance !== null ? parseFloat(balance) : 0;

  const arcValue = bal * 1;
  const usdcToken = erc20Balances.find((t) => t.symbol === "USDC");
  const eurcToken = erc20Balances.find((t) => t.symbol === "EURC");
  const usdcValue = usdcToken ? parseFloat(usdcToken.balance) * usdcToken.priceUsd : 0;
  const eurcValue = eurcToken ? parseFloat(eurcToken.balance) * eurcToken.priceUsd : 0;

  const rawData = bal > 0 || isConnected
    ? [
        { name: ArcTestnet.nativeCurrency.symbol, value: arcValue },
        { name: "USDC", value: usdcValue },
        { name: "EURC", value: eurcValue },
      ].filter((d) => d.value > 0 || d.name === ArcTestnet.nativeCurrency.symbol)
    : [
        { name: ArcTestnet.nativeCurrency.symbol, value: 1400 },
        { name: "USDC", value: 456.78 },
        { name: "EURC", value: 350.0 },
      ];

  // deduplicate by symbol
  const seen = new Map<string, typeof rawData[0]>();
  for (const item of rawData) seen.set(item.name, item);
  const data = Array.from(seen.values());

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />

      <h2 className="text-sm font-medium text-gray-400 mb-1">Portfolio Summary</h2>

      <div className="text-center py-1">
        <p className="text-xs tracking-widest uppercase text-gray-500 mb-1">Total Portfolio Balance</p>
        <p className="text-3xl font-bold animate-holo-text tracking-tight">
          ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          <span className="text-lg font-normal text-gray-500">USD</span>
        </p>
        {isConnected && balance !== null && (
          <p className="text-sm text-gray-400 mt-0.5">
            {bal.toFixed(4)}{" "}
            <span className="text-indigo-300 font-medium">{ArcTestnet.nativeCurrency.symbol}</span>
          </p>
        )}
      </div>

      <div className="w-full mt-2">
        <ResponsiveContainer width="100%" height={144}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              strokeWidth={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, index) => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", transition: "all 0.3s ease" }}
            >
              {data.map((entry, index) => {
                const color = COLOR_MAP[entry.name] ?? "#06b6d4";
                const isHovered = hovered === index;
                return (
                  <Cell
                    key={index}
                    fill={isHovered ? `${color}bb` : color}
                    stroke={isHovered ? "#ffffff88" : "#111827"}
                    strokeWidth={isHovered ? 3 : 2}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tooltip on hover */}
      {hovered !== null && data[hovered] && (
        <div
          className="absolute top-[40%] left-1/2 -translate-x-1/2 pointer-events-none z-10 rounded-xl bg-gray-900/95 border border-white/10 px-3 py-2 backdrop-blur-md shadow-lg text-center"
          style={{ transition: "opacity 0.2s ease" }}
        >
          <p className="text-xs font-semibold text-white">{data[hovered].name}</p>
          <p className="text-xs text-indigo-300 font-mono">
            {data[hovered].value.toFixed(2)} USD
          </p>
          {totalValue > 0 && (
            <p
              className="text-xs font-medium mt-0.5"
              style={{ color: COLOR_MAP[data[hovered].name] }}
            >
              {((data[hovered].value / totalValue) * 100).toFixed(1)}% of portfolio
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-2">
        {data.map((item, i) => {
          const color = COLOR_MAP[item.name] ?? "#06b6d4";
          const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0";
          return (
            <div key={`legend-${item.name}`} className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-all duration-200 hover:bg-white/5 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
              <span className="text-[10px]" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
