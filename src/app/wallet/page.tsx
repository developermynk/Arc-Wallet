"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Copy,
  Check,
  Send,
  X,
  ScanLine,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { useState } from "react";
import { QuickActions } from "@/components/QuickActions";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { parseUnits } from "viem";

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

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function WalletPage() {
  const { address, balance, isConnected, adapter, transactions, addTransaction } = useArcWallet();
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <Wallet className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold">Wallet</h1>
      </motion.div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <GlassCard delay={0.1}>
          <h2 className="mb-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
            Your Address
          </h2>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-300">{shortenAddress(address)}</span>
              <button
                onClick={async () => await navigator.clipboard.writeText(address!)}
                className="text-gray-600 hover:text-indigo-400 transition-colors btn-micro"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Connect your wallet to view</p>
          )}
        </GlassCard>

        <GlassCard delay={0.15}>
          <h2 className="mb-4 text-sm font-medium text-gray-400 uppercase tracking-wider">
            Balance
          </h2>
          {isConnected && balance !== null ? (
            <>
              <p className="text-4xl font-bold animate-holo-text">
                {parseFloat(balance).toFixed(4)}{" "}
                <span className="text-xl">{ArcTestnet.nativeCurrency.symbol}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">Arc Testnet</p>
            </>
          ) : (
            <p className="text-4xl font-bold text-gray-700">--</p>
          )}
        </GlassCard>

        <GlassCard delay={0.2}>
          <h2 className="mb-4 text-sm font-medium text-gray-400 uppercase tracking-wider">
            Quick Actions
          </h2>
          <QuickActions
            disabled={!isConnected}
            onClick={(action) => {
              if (action === "send") setShowSend(true);
              if (action === "receive" && address) setShowReceive(true);
            }}
          />
        </GlassCard>
      </div>

      {/* Recent Transactions */}
      <GlassCard delay={0.3}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
        </div>
        {transactions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="term-log rounded-xl border border-white/5 px-4 py-3 text-xs"
              >
                <div className="flex items-center justify-between">
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
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-mono text-indigo-300/80">
                        <span className="text-zinc-500">to</span> {shortenAddress(tx.to)}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-600">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono text-sm ${
                        tx.status === "confirmed"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      -{parseFloat(tx.amount).toFixed(4)}{" "}
                      {ArcTestnet.nativeCurrency.symbol}
                    </p>
                    <a
                      href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors cursor-pointer"
                      title={tx.hash}
                    >
                      {shortenAddress(tx.hash)}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
            <Clock className="h-10 w-10 mb-3" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Your transaction history will appear here</p>
          </div>
        )}
      </GlassCard>

      {/* Send Modal */}
      <AnimatePresence>
        {showSend && (
          <SendForm
            address={address}
            adapter={adapter}
            addTransaction={addTransaction}
            onClose={() => setShowSend(false)}
          />
        )}
      </AnimatePresence>

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceive && address && (
          <ReceiveModal
            address={address}
            onClose={() => setShowReceive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Send Form Modal                                                    */
/* ------------------------------------------------------------------ */

function SendForm({
  address,
  adapter,
  addTransaction,
  onClose,
}: {
  address: string | null;
  adapter: any | null;
  addTransaction: (tx: { hash: string; from: string; to: string; amount: string; status: 'confirmed' | 'failed' }) => void;
  onClose: () => void;
}) {
  const symbol = ArcTestnet.nativeCurrency.symbol;
  const decimals = ArcTestnet.nativeCurrency.decimals;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const validateRecipient = (value: string) => {
    setRecipient(value);
    if (value === "") { setRecipientError(null); return; }
    if (!EVM_ADDRESS_REGEX.test(value)) {
      setRecipientError("Invalid EVM address (0x + 40 hex chars)");
    } else {
      setRecipientError(null);
    }
  };

  const validateAmount = (value: string) => {
    setAmount(value);
    if (value === "") { setAmountError(null); return; }
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setAmountError("Enter a valid positive amount");
    } else {
      setAmountError(null);
    }
  };

  const handleSend = async () => {
    setError(null);
    setTxHash(null);

    if (!recipient || recipientError) { setError("Fix the recipient address first"); return; }
    if (!amount || amountError || parseFloat(amount) === 0) { setError("Enter a valid amount"); return; }
    if (!adapter) { setError("Wallet adapter not initialized"); return; }

    setSending(true);
    try {
      const value = parseUnits(amount, decimals);
      const prepared = await adapter.prepare(
        { address: recipient as `0x${string}`, value },
        { chain: "Arc_Testnet" }
      );
      await prepared.estimate();
      setRecipientError(null);
      setAmountError(null);
      setError(null);
      const hash = await prepared.execute();
      setTxHash(hash);
      addTransaction({ hash, from: address!, to: recipient, amount, status: "confirmed" });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
      addTransaction({ hash: "failed", from: address!, to: recipient, amount, status: "failed" });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setRecipient("");
    setAmount("");
    setTxHash(null);
    setError(null);
    setRecipientError(null);
    setAmountError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="mx-4 max-w-md w-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">Send {symbol}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white btn-micro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {txHash || error ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            {txHash ? (
              <>
                <Check className="h-12 w-12 text-emerald-400" />
                <h4 className="text-lg font-bold text-emerald-400">Transfer Complete</h4>
                <p className="max-w-[220px] break-all text-[11px] font-mono text-zinc-500">{txHash}</p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-400" />
                <h4 className="text-lg font-bold text-red-400">Failed</h4>
                <p className="text-xs text-zinc-500">{error}</p>
              </>
            )}
            <div className="flex gap-2 mt-2">
              {error && (
                <button
                  onClick={() => setError(null)}
                  className="rounded-lg bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-gray-300 btn-micro"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={reset}
                className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-xs text-indigo-400 btn-micro"
              >
                {error ? "Close" : "New Transfer"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sender */}
            <div className="mb-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span>From</span>
              <span className="font-mono text-indigo-400/70">{address}</span>
            </div>

            {/* Recipient */}
            <div className="mb-3">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => validateRecipient(e.target.value)}
                disabled={sending}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-zinc-200 outline-none placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
              />
              {recipientError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {recipientError}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Amount
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => validateAmount(e.target.value)}
                  disabled={sending}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-indigo-400/80">{symbol}</span>
              </div>
              {amountError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {amountError}
                </p>
              )}
            </div>

            {/* General error */}
            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors btn-micro disabled:opacity-50"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ScanLine className="h-4 w-4" />
                  </motion.div>
                  BROADCASTING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  SEND {symbol}
                </span>
              )}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Receive Modal                                                      */
/* ------------------------------------------------------------------ */

import { QrCode } from "lucide-react";

function ReceiveModal({
  address,
  onClose,
}: {
  address: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="mx-4 max-w-sm w-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-8 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">Receive</h3>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your address to receive Arc tokens
        </p>

        <div className="rounded-xl bg-white p-4 w-full flex justify-center">
          <QRCodeSVG value={address} size={180} level="M" />
        </div>

        <div className="rounded-lg bg-white/5 px-3 py-2 w-full">
          <pre className="text-xs font-mono text-gray-300 break-all text-center leading-relaxed">
            {address}
          </pre>
        </div>

        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-3 text-sm text-indigo-400 ring-1 ring-indigo-500/20 btn-micro"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Address
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 btn-micro"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
