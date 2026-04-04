"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search, ChevronDown } from "lucide-react";
import type { SwapTokenName } from "@/contexts/SwapProvider";

const TOKEN_META: Record<string, { symbol: string; color: string }> = {
  USDC: { symbol: "USDC", color: "#2775CA" },
  USDT: { symbol: "USDT", color: "#26A17B" },
  EURC: { symbol: "EURC", color: "#7B98F0" },
  DAI: { symbol: "DAI", color: "#F5AC37" },
  USDE: { symbol: "USDE", color: "#0052FF" },
  PYUSD: { symbol: "PYUSD", color: "#04080F" },
  WETH: { symbol: "WETH", color: "#627EEA" },
  WBTC: { symbol: "WBTC", color: "#F7931A" },
  WSOL: { symbol: "WSOL", color: "#9945FF" },
  WAVAX: { symbol: "WAVAX", color: "#E84142" },
  WPOL: { symbol: "WPOL", color: "#8247E5" },
  NATIVE: { symbol: "NATIVE", color: "#9CA3AF" },
};

interface TokenPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: string) => void;
  selected: string;
  excludeToken?: string;
}

export function TokenPickerModal({
  open,
  onClose,
  onSelect,
  selected,
  excludeToken,
}: TokenPickerModalProps) {
  const [search, setSearch] = useState("");

  const tokens: string[] = ["USDC", "EURC", "USDT", "DAI", "USDE", "PYUSD", "WETH", "WBTC", "WSOL", "WAVAX", "WPOL", "NATIVE"];
  const filtered = tokens.filter((t) => {
    if (t === excludeToken) return false;
    if (!search) return true;
    return t.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.15 }}
            className="mx-4 max-w-sm w-full rounded-2xl bg-zinc-900 backdrop-blur-md border border-white/10 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Select Token</h3>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-1 pr-1">
              {filtered.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-6">No tokens found</p>
              )}
              {filtered.map((token) => {
                const meta = TOKEN_META[token];
                const isSelected = token === selected;
                return (
                  <button
                    key={token}
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "bg-transparent border border-transparent hover:bg-white/5"
                    } cursor-pointer`}
                  >
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.symbol.slice(0, 2)}
                    </div>
                    <span className="text-white/90 font-medium">{meta.symbol}</span>
                    {isSelected && (
                      <span className="ml-auto">
                        <Check className="size-4 text-indigo-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Inline token selector button (used inside swap input rows) */
export function TokenSelectorButton({
  token,
  onClick,
}: {
  token: string;
  onClick: () => void;
}) {
  const meta = TOKEN_META[token];
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white border border-white/10 transition-colors cursor-pointer"
    >
      <div
        className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
        style={{ backgroundColor: meta.color }}
      >
        {meta.symbol.slice(0, 2)}
      </div>
      <span className="font-medium">{meta.symbol}</span>
      <ChevronDown className="size-3 text-gray-400" />
    </button>
  );
}
