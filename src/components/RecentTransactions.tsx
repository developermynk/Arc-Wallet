"use client";

import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { ExternalLink } from "lucide-react";

function shortenAddress(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium">
        <span>✓</span>
        Confirmed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Pending
    </span>
  );
}

export function RecentTransactions() {
  const { transactions, isConnected } = useArcWallet();

  if (!isConnected || transactions.length === 0) {
    return (
      <div className="glass-panel p-4 flex flex-col items-center justify-center py-16">
        <div className="text-gray-600 text-sm text-center">
          <p className="font-medium">No transactions yet</p>
          <p className="text-sm mt-1 text-gray-700">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold mb-3 text-white">Recent Transactions</h2>

      <div className="grid grid-cols-[0.8fr_1.2fr_1fr_0.8fr_0.5fr] gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-white/5">
        <span>Date</span>
        <span>Address</span>
        <span>Value</span>
        <span>Status</span>
        <span></span>
      </div>

      <div className="flex flex-col max-h-[220px] overflow-y-auto custom-scrollbar">
        {transactions.slice(0, 5).map((tx, i) => (
          <div
            key={tx.hash}
            className="grid grid-cols-[0.8fr_1.2fr_1fr_0.8fr_0.5fr] gap-3 px-3 py-3 text-sm transition-colors hover:bg-white/5 rounded-lg"
          >
            <span className="text-gray-400 self-center text-xs">
              {new Date(tx.timestamp).toLocaleDateString()}
            </span>
            <a
              href={`${ArcTestnet.explorerUrl.replace("{hash}", tx.hash)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/80 font-mono text-xs self-center hover:text-indigo-300 flex items-center gap-1"
            >
              {shortenAddress(tx.to)}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <span className="self-center text-sm font-medium">
              <span className={tx.status === "confirmed" ? "text-emerald-400" : "text-red-400"}>
                {tx.status === "failed" ? "-" : ""}{parseFloat(tx.amount).toFixed(2)} {ArcTestnet.nativeCurrency.symbol}
              </span>
            </span>
            <div className="self-center">
              <StatusBadge status={tx.status} />
            </div>
            <span className="text-gray-400 self-center text-sm">
              {tx.status === "confirmed" ? "→" : "~"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
