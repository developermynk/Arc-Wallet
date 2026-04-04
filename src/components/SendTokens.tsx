"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { useState } from "react";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { parseUnits } from "viem";

const NATIVE_DECIMALS = ArcTestnet.nativeCurrency.decimals;
const NATIVE_SYMBOL = ArcTestnet.nativeCurrency.symbol;

// EIP-55 mixed-case validation
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function isValidEvMAccount(value: string): boolean {
  return EVM_ADDRESS_REGEX.test(value);
}

/**
 * SendTokens component — high-tech terminal style floating card
 * using the Arc Viem adapter for same-chain native token transfers.
 */
export function SendTokens() {
  const { isConnected, adapter, address: senderAddress } = useArcWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const validateRecipient = (value: string) => {
    setRecipient(value);
    if (value === "") {
      setRecipientError(null);
      return;
    }
    if (!isValidEvMAccount(value)) {
      setRecipientError("Invalid EVM address (must be 0x followed by 40 hex chars)");
    } else {
      setRecipientError(null);
    }
  };

  const validateAmount = (value: string) => {
    setAmount(value);
    if (value === "") {
      setAmountError(null);
      return;
    }
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

    if (!recipientError && recipient === "") {
      setError("Recipient address is required");
      return;
    }
    if (recipientError) {
      setError("Fix the highlighted errors before sending");
      return;
    }
    if (amountError || !amount || parseFloat(amount) === 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!adapter) {
      setError("Wallet adapter not initialized");
      return;
    }

    setSending(true);

    try {
      const value = parseUnits(amount, NATIVE_DECIMALS);

      const prepared = await adapter.prepare(
        {
          address: recipient as `0x${string}`,
          value,
        },
        { chain: "Arc_Testnet" }
      );

      await prepared.estimate();
      const hash = (await prepared.execute()) as string;
      setTxHash(hash);
    } catch (err: any) {
      console.error("Transfer failed:", err);
      setError(err?.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  const explorerUrl = txHash
    ? `${ArcTestnet.explorerUrl.replace("{hash}", txHash)}`
    : null;

  const reset = () => {
    setRecipient("");
    setAmount("");
    setTxHash(null);
    setError(null);
    setRecipientError(null);
    setAmountError(null);
  };

  if (!isConnected) {
    return (
      <ScanTokenCard />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full max-w-md"
    >
      {/* Outer glow border */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-500/20 via-indigo-500/20 to-violet-500/20 p-[1px]">
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <ScanLine className="size-4 text-indigo-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-200">
                SEND TOKENS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Arc Testnet
              </span>
            </div>
          </div>

          <div className="px-5 py-4">
            {/* Sender */}
            <div className="mb-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span>From</span>
              <span className="font-mono text-indigo-400/70">{senderAddress}</span>
            </div>

            {/* Recipient */}
            <InputField
              label="Recipient Address"
              placeholder="0x..."
              value={recipient}
              onChange={validateRecipient}
              error={recipientError}
              disabled={sending}
              rightEl={
                <span className="text-[10px] text-zinc-600 uppercase">EVM</span>
              }
            />

            {/* Amount */}
            <InputField
              label={`Amount (${NATIVE_SYMBOL})`}
              placeholder="0.00"
              value={amount}
              onChange={validateAmount}
              error={amountError}
              disabled={sending}
              type="number"
              step="0.01"
              rightEl={
                <span className="text-[11px] font-semibold text-indigo-400/80">
                  {NATIVE_SYMBOL}
                </span>
              }
            />

            {/* Arrow divider */}
            <div className="flex items-center justify-center my-2">
              <ArrowRight className="size-4 text-zinc-700" />
            </div>

            {/* General error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={sending || !isConnected}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group relative mt-3 w-full cursor-pointer overflow-hidden rounded-xl disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-500 to-violet-500 opacity-90 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white">
                {sending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ScanLine className="size-4" />
                    </motion.div>
                    BROADCASTING...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    SEND {NATIVE_SYMBOL}
                  </>
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Success / Failure overlay */}
      <AnimatePresence>
        {(txHash || error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gray-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex flex-col items-center gap-3 px-6 text-center"
            >
              {txHash ? (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  >
                    <CheckCircle2 className="size-12 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-emerald-400">
                    Transfer Complete
                  </h3>
                  <p className="max-w-[220px] break-all text-[11px] font-mono text-zinc-500">
                    {txHash}
                  </p>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 btn-micro"
                    >
                      View on Explorer <ExternalLink className="size-3" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: 30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  >
                    <XCircle className="size-12 text-red-400" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-red-400">
                    Transaction Failed
                  </h3>
                  <p className="max-w-[220px] text-xs text-zinc-500">{error}</p>
                </>
              )}

              <button
                onClick={reset}
                className="mt-2 rounded-lg border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 btn-micro"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Not-connected prompt                                               */
/* ------------------------------------------------------------------ */

function ScanTokenCard() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-md"
    >
      <div className="relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Send className="size-8 text-zinc-700" />
          <span className="text-sm font-semibold text-zinc-600">
            Send Tokens
          </span>
          <span className="text-xs text-zinc-700">
            Connect your wallet to send {ArcTestnet.nativeCurrency.symbol}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable input field                                               */
/* ------------------------------------------------------------------ */

function InputField({
  label,
  error,
  value,
  onChange,
  placeholder,
  disabled,
  rightEl,
  type = "text",
  step,
}: {
  label: string;
  error?: string | null;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rightEl?: React.ReactNode;
  type?: string;
  step?: string;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </label>
        {rightEl}
      </div>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border bg-zinc-900/60 px-3 py-2 text-sm font-mono tracking-wide text-zinc-200 placeholder:text-zinc-700 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 ${
          error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : "border-zinc-800/60"
        }`}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1 flex items-center gap-1 text-[11px] text-red-400"
          >
            <AlertCircle className="size-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
