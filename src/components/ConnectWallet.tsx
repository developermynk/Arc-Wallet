"use client";

import { motion } from "framer-motion";
import { Wallet, Zap, Copy, Power } from "lucide-react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { useState } from "react";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectWallet() {
  const { address, balance, isConnected, connecting, connect, disconnect } =
    useArcWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Connected state
  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Outer glow container */}
        <div className="relative rounded-xl bg-gradient-to-r from-indigo-500/20 via-indigo-500/20 to-violet-500/20 p-[1px]">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2.5">
            {/* Status indicator */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]"
            />

            {/* Address + balance */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="font-mono text-sm text-indigo-300 hover:text-indigo-200 btn-micro cursor-pointer"
                  title={address ?? undefined}
                >
                  {shortenAddress(address!)}
                </button>
                {copied ? (
                  <span className="text-[10px] text-emerald-400">Copied</span>
                ) : (
                  <Copy
                    className="size-3.5 text-indigo-400/50 hover:text-indigo-300 btn-micro cursor-pointer"
                    onClick={handleCopy}
                  />
                )}
              </div>
              <div className="text-[11px] text-gray-400 tabular-nums">
                {parseFloat(balance!).toFixed(4)}{" "}
                <span className="text-blue-400/80">A</span>
              </div>
            </div>

            {/* Disconnect */}
            <button
              onClick={disconnect}
              className="ml-1 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 btn-micro cursor-pointer"
              title="Disconnect"
            >
              <Power className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Disconnected state
  return (
    <motion.button
      onClick={connect}
      disabled={connecting}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group rounded-xl p-[1px] cursor-pointer disabled:cursor-not-allowed"
    >
      {/* Animated gradient border glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500 via-indigo-500 to-violet-500 blur-md"
        style={{ boxShadow: "0 0 20px 4px rgba(6,182,212,0.3)" }}
      />
      <div className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-500 blur-xl group-hover:animate-pulse" />

      {/* Button body */}
      <div className="relative flex items-center gap-2 rounded-xl bg-gray-950 group-hover:from-indigo-500/10 group-hover:via-indigo-500/10 group-hover:to-violet-500/10 group-hover:bg-gradient-to-r transition-all duration-500 px-5 py-3">
        {connecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="size-5 text-indigo-400" />
            </motion.div>
            <span className="text-sm font-medium text-gray-300">
              Connecting...
            </span>
          </>
        ) : (
          <>
            <Wallet className="size-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span className="text-sm font-medium bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-violet-300 transition-all">
              Connect Wallet
            </span>
          </>
        )}

        {/* Hover glow ring */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-indigo-500/50 group-hover:shadow-[0_0_25px_-4px_rgba(6,182,212,0.4)] transition-all duration-500" />
      </div>
    </motion.button>
  );
}
