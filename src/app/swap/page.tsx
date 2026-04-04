"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, ChevronDown, Check, ExternalLink, Info, Loader2 } from "lucide-react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { useSwap, ARC_TOKENS, SWAP_TOKENS, TOKEN_COLORS, ERC20_ABI, type SwapTokenName } from "@/contexts/SwapProvider";
import { createPublicClient, http, formatUnits } from "viem";
import { ArcTestnet } from "@circle-fin/app-kit/chains";

const RPC_URL = ArcTestnet.rpcEndpoints[0];

const publicClient = createPublicClient({
  transport: http(RPC_URL),
  chain: {
    id: ArcTestnet.chainId,
    name: ArcTestnet.name,
    nativeCurrency: ArcTestnet.nativeCurrency,
    rpcUrls: { default: { http: [RPC_URL] } },
  } as any,
});

/* ── Helpers ── */

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 ${className}`}>
      {children}
    </div>
  );
}

function SwapInputRow({
  label, token, amount, onAmountChange, onClickToken, readOnly, balance,
}: {
  label: string; token: SwapTokenName; amount: string; onAmountChange?: (v: string) => void;
  onClickToken?: () => void; readOnly?: boolean; balance: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-[11px] text-gray-600">Balance: {parseFloat(balance || "0").toFixed(4)}</span>
      </div>
      <div className="flex items-center gap-3">
        {onClickToken ? (
          <button
            type="button" onClick={onClickToken}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white border border-white/10 transition-colors cursor-pointer"
          >
            <div
              className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: TOKEN_COLORS[token as keyof typeof TOKEN_COLORS] }}
            >
              {token.slice(0, 2)}
            </div>
            <span className="font-medium">{token}</span>
            <ChevronDown className="size-3 text-gray-400" />
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm text-white">
            <div
              className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: TOKEN_COLORS[token as keyof typeof TOKEN_COLORS] }}
            >
              {token.slice(0, 2)}
            </div>
            <span className="font-medium">{token}</span>
          </div>
        )}
        <input
          type="text" inputMode="decimal" placeholder="0.0" value={amount}
          onChange={(e) => { const v = e.target.value; /^(\d*\.?\d*)?$/.test(v) && onAmountChange?.(v); }}
          readOnly={readOnly}
          className={`w-full bg-transparent text-2xl font-mono placeholder:text-gray-700 outline-none text-right ${readOnly ? "text-gray-400 cursor-default" : "text-white"}`}
        />
      </div>
    </div>
  );
}

/* ── Token Picker ── */
function TokenPicker({
  open, onClose, onSelect, selected, excludeToken,
}: {
  open: boolean; onClose: () => void; onSelect: (t: SwapTokenName) => void;
  selected: SwapTokenName; excludeToken?: SwapTokenName;
}) {
  if (!open) return null;
  const available = SWAP_TOKENS.filter((t) => t !== excludeToken);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} transition={{ duration: 0.15 }}
        className="mx-4 max-w-sm w-full rounded-2xl bg-zinc-900 backdrop-blur-md border border-white/10 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white/90 mb-4">Select Token</h3>
        <div className="flex flex-col gap-1">
          {available.map((token) => (
            <button key={token} onClick={() => { onSelect(token); onClose(); }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                token === selected ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-transparent border border-transparent hover:bg-white/5"
              } cursor-pointer`}
            >
              <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: TOKEN_COLORS[token] }}>
                {token.slice(0, 2)}
              </div>
              <span className="text-white/90 font-medium">{token}</span>
              {token === selected && <Check className="size-4 text-indigo-400 ml-auto" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Page ── */

export default function SwapPage() {
  const { address, isConnected, adapter, erc20Balances: _unused, connect } = useArcWallet();
  const { fetchQuote, executeSwap, clear, isEstimating, isSwapping, quote, lastResult, error } = useSwap();

  const [fromToken, setFromToken] = useState<SwapTokenName>(SWAP_TOKENS[0]);
  const [toToken, setToToken] = useState<SwapTokenName>(SWAP_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [toPickerOpen, setToPickerOpen] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  /* Fetch token balances on Arc Testnet */
  useEffect(() => {
    if (!isConnected || !address) return;
    let cancelled = false;
    const fetchAll = async () => {
      const balances: Record<string, string> = {};
      for (const [sym, def] of Object.entries(ARC_TOKENS)) {
        try {
          const bal = await publicClient.readContract({
            address: def.address, abi: ERC20_ABI,
            functionName: "balanceOf", args: [address as `0x${string}`],
          });
          balances[sym] = formatUnits(bal as bigint, def.decimals);
        } catch { balances[sym] = "0"; }
      }
      if (!cancelled) setTokenBalances(balances);
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [isConnected, address]);

  /* Auto-quote */
  useEffect(() => {
    if (!isConnected || !adapter || !fromAmount || parseFloat(fromAmount) <= 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuote(fromToken, toToken, fromAmount, adapter);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = useCallback(async () => {
    if (!isConnected || !adapter || !fromAmount) return;
    clear();
    const ok = await executeSwap(fromToken, toToken, fromAmount, adapter);
    if (ok) setFromAmount("");
  }, [isConnected, adapter, fromAmount, fromToken, toToken, executeSwap, clear]);

  const handleFlip = () => {
    setFromToken(toToken as SwapTokenName);
    setToToken(fromToken as SwapTokenName);
    setFromAmount("");
  };

  const isButtonDisabled = !isConnected || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0;
  const buttonLabel = () => {
    if (!isConnected) return "Connect Wallet to Swap";
    if (isSwapping) return "Swapping...";
    if (isEstimating) return "Getting Quote...";
    if (!fromAmount || parseFloat(fromAmount) === 0) return "Enter Amount";
    if (error) return "Try Again";
    return "Swap";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-indigo-400" />
          <h1 className="text-2xl font-bold">Swap</h1>
        </div>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">Arc Testnet</span>
      </div>

      {/* Info */}
      <GlassCard>
        <div className="flex items-center gap-2 p-4 text-xs text-gray-400">
          <Info className="h-4 w-4 shrink-0" />
          <span>Supported tokens: {SWAP_TOKENS.join(", ")}. Quotes use price-based rates on testnet.</span>
        </div>
      </GlassCard>

      {/* Swap Form */}
      <div className="mx-auto w-full max-w-md flex flex-col gap-3">
        <SwapInputRow
          label="You pay" token={fromToken} amount={fromAmount}
          onAmountChange={setFromAmount} onClickToken={() => setFromPickerOpen(true)}
          balance={tokenBalances[fromToken] ?? "0"}
        />

        <div className="flex justify-center -my-1 relative z-10">
          <button type="button" onClick={handleFlip}
            className="rounded-xl bg-zinc-900 border border-white/10 p-2.5 text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Flip tokens"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>
        </div>

        <SwapInputRow
          label="You receive" token={toToken} amount={quote?.estimatedOutput ?? ""}
          readOnly onClickToken={() => setToPickerOpen(true)}
          balance={tokenBalances[toToken] ?? "0"}
        />

        {/* Quote Details */}
        {quote && (
          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Quote Details
              </h3>
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="text-gray-300">1 {quote.tokenIn} ≈ {quote.rate.toFixed(4)} {quote.tokenOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min. Receive</span>
                  <span className="text-gray-300">{quote.stopLimit} {toToken}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400"
            >
              <span className="flex-1">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Button */}
        <motion.button
          onClick={isConnected ? handleSwap : connect} disabled={isButtonDisabled}
          className={`w-full rounded-2xl py-4 text-base font-semibold text-white transition-all duration-300 ${
            isButtonDisabled ? "bg-white/10 opacity-50 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 cursor-pointer shadow-lg shadow-indigo-500/10"
          }`}
        >
          {(isSwapping || isEstimating) ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {buttonLabel()}
            </span>
          ) : buttonLabel()}
        </motion.button>

        {/* Success */}
        <AnimatePresence>
          {lastResult && (
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
              className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Swap Successful</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Swapped</span>
                  <span className="text-gray-300">
                    {lastResult.amountIn} {lastResult.tokenIn} → {lastResult.amountOut} {lastResult.tokenOut}
                  </span>
                </div>
                {lastResult.explorerUrl && (
                  <a href={lastResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 mt-1"
                  >
                    <span className="font-mono text-[10px] truncate max-w-[120px]">{lastResult.txHash}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Token Pickers */}
      <TokenPicker open={fromPickerOpen} onClose={() => setFromPickerOpen(false)} onSelect={setFromToken} selected={fromToken} />
      <TokenPicker open={toPickerOpen} onClose={() => setToPickerOpen(false)} onSelect={setToToken} selected={toToken} />
    </div>
  );
}
