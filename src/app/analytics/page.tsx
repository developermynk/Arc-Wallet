"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Image,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
} from "lucide-react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { useState } from "react";

function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AnalyticsPage() {
  const { balance, transactions, address, nfts } = useArcWallet();
  const [showTransactions, setShowTransactions] = useState(false);
  const [showNfts, setShowNfts] = useState(false);

  const balanceNum = balance ? parseFloat(balance) : 0;
  const txCount = transactions.length;
  const sentCount = transactions.filter((t) => t.from === address).length;
  const recvCount = transactions.filter((t) => t.to === address).length;
  const totalSent = transactions
    .filter((t) => t.from === address)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalRecv = transactions
    .filter((t) => t.to === address)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const nftCount = nfts.reduce((sum, n) => sum + parseInt(n.balance, 10) || 0, 0);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <BarChart3 className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold">Analytics</h1>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Balance */}
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-3">
              <DollarSign className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance</p>
              {balance !== null ? (
                <p className="text-xl font-bold">
                  {balanceNum.toFixed(4)}{" "}
                  <span className="text-sm text-gray-400">
                    {ArcTestnet.nativeCurrency.symbol}
                  </span>
                </p>
              ) : (
                <p className="text-xl font-bold text-gray-600">--</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Transactions toggle */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          onClick={() => {
            setShowTransactions(!showTransactions);
            setShowNfts(false);
          }}
          className={`flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl border p-6 transition-all ${
            showTransactions
              ? "bg-indigo-500/10 border-indigo-500/30"
              : "bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10"
          }`}
        >
          <div
            className={`rounded-xl p-3 ${
              showTransactions ? "bg-indigo-500/20" : "bg-emerald-500/10"
            }`}
          >
            <TrendingUp
              className={`h-5 w-5 ${
                showTransactions ? "text-indigo-300" : "text-emerald-400"
              }`}
            />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">Transactions</p>
            <p className="text-xl font-bold">
              {txCount}
              {showTransactions ? "" : ""}
            </p>
          </div>
          {showTransactions ? (
            <ChevronUp className="ml-auto h-5 w-5 text-indigo-400" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5 text-gray-600" />
          )}
        </motion.button>

        {/* NFTs toggle */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          onClick={() => {
            setShowNfts(!showNfts);
            setShowTransactions(false);
          }}
          className={`flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl border p-6 transition-all ${
            showNfts
              ? "bg-purple-500/10 border-purple-500/30"
              : "bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10"
          }`}
        >
          <div
            className={`rounded-xl p-3 ${
              showNfts ? "bg-purple-500/20" : "bg-purple-500/10"
            }`}
          >
            <Image
              className={`h-5 w-5 ${
                showNfts ? "text-purple-300" : "text-purple-400"
              }`}
            />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">NFTs</p>
            <p className="text-xl font-bold">
              {nfts.length > 0 ? `${nfts.length} collection${nfts.length !== 1 ? "s" : ""}` : "--"}
            </p>
          </div>
          {showNfts ? (
            <ChevronUp className="ml-auto h-5 w-5 text-purple-400" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5 text-gray-600" />
          )}
        </motion.button>

        {/* Status */}
        <GlassCard delay={0.25}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3">
              <ArrowUpRight className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              {balance !== null ? (
                <p className="text-xl font-bold">Active</p>
              ) : (
                <p className="text-xl font-bold text-gray-600">Not Connected</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Expanded Transactions Section */}
      <AnimatePresence>
        {showTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  Transaction History
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {txCount} total
                  </span>
                </h2>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="p-1 rounded-lg hover:bg-white/5 btn-micro text-gray-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {txCount > 0 ? (
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div
                      key={tx.hash}
                      className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            tx.status === "confirmed"
                              ? "bg-emerald-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          {tx.status === "confirmed" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-mono text-gray-300">
                            <span className="text-gray-600">
                              {tx.from === address ? (
                                <ArrowUpRight className="inline h-3 w-3 text-red-400" />
                              ) : (
                                <ArrowDownLeft className="inline h-3 w-3 text-emerald-400" />
                              )}
                              {tx.from === address ? "Sent" : "Received"}
                            </span>
                            {tx.from === address ? (
                              <span className="ml-1">↗ {shortenAddress(tx.to)}</span>
                            ) : (
                              <span className="ml-1">↙ {shortenAddress(tx.from)}</span>
                            )}
                          </p>
                          <p className="text-gray-600">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.from === address
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {tx.from === address ? "-" : "+"}
                          {parseFloat(tx.amount).toFixed(4)}{" "}
                          {ArcTestnet.nativeCurrency.symbol}
                        </p>
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-gray-600 hover:text-indigo-400 transition-colors cursor-pointer"
                          title={tx.hash}
                        >
                          {shortenAddress(tx.hash)}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                  <Activity className="h-10 w-10 mb-3" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded NFTs Section */}
      <AnimatePresence>
        {showNfts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5 text-purple-400" />
                  Your NFTs
                  {nfts.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {nfts.length} collection{nfts.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowNfts(false)}
                  className="p-1 rounded-lg hover:bg-white/5 btn-micro text-gray-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {nfts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {nfts.map((nft) => (
                    <div
                      key={nft.contractAddress}
                      className="flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-purple-500/10 to-cyan-500/10 overflow-hidden">
                        {nft.imageUrl ? (
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Image className="h-12 w-12 text-gray-700" />
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <p className="text-sm font-medium truncate">{nft.name}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{nft.symbol}</span>
                          <span>{nft.balance}</span>
                        </div>
                        <p className="text-[10px] text-gray-700 font-mono truncate">
                          {nft.contractAddress}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                  <Image className="h-10 w-10 mb-3" />
                  <p className="text-sm">No NFTs found</p>
                  <p className="text-xs mt-1">Your NFTs on Arc Testnet will appear here</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Overview */}
      <GlassCard delay={0.3} className="min-h-[200px]">
        <h2 className="mb-4 text-lg font-semibold">Portfolio Overview</h2>
        {balance !== null ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Asset</span>
              <span className="text-sm text-gray-400">Amount</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-400" />
                <span className="text-sm font-medium">{ArcTestnet.nativeCurrency.symbol}</span>
              </div>
              <span className="text-sm font-mono">{balanceNum.toFixed(4)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-indigo-400 to-violet-400" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-600">
            <BarChart3 className="h-10 w-10 mb-3" />
            <p className="text-sm">Connect wallet to view allocation</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
