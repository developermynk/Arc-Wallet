"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Repeat2,
  ChevronDown, Zap, X, Copy, CheckCircle2, QrCode, AlertCircle, Send, XCircle, Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { parseUnits } from "viem";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { AssetPortfolio } from "@/components/AssetPortfolio";
import { RecentTransactions } from "@/components/RecentTransactions";
import { NetworkMonitor } from "@/components/NetworkMonitor";
import { TokenPickerModal } from "@/components/TokenPickerModal";
import Link from "next/link";

type ActionKey = "send" | "receive" | "bridge" | "swap" | null;

const actions = [
  { label: "Send", icon: ArrowUpRight, key: "send" as const },
  { label: "Receive", icon: ArrowDownLeft, key: "receive" as const },
  { label: "Swap", icon: ArrowRightLeft, key: "swap" as const },
  { label: "Bridge", icon: Repeat2, key: "bridge" as const },
];

function ActionButton({ icon: Icon, label, onClick, disabled }: {
  icon: typeof ArrowUpRight;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="qa-btn group relative flex w-full flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:cursor-pointer hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.03]"
    >
      <span className="text-indigo-400 transition-colors duration-200 group-hover:text-indigo-300">
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium tracking-wide text-white/60 transition-colors duration-200 group-hover:text-white/90">
        {label}
      </span>
    </button>
  );
}

function QuickActionPanel({ onAction, disabled }: {
  onAction: (key: ActionKey) => void;
  disabled: boolean;
}) {
  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, icon, key }) => (
          <ActionButton
            key={label}
            icon={icon}
            label={label}
            onClick={() => onAction(key)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Top Bar ── */
function TopBar() {
  const { balance, isConnected, address, disconnect, connect, connecting } = useArcWallet();
  const bal = isConnected && balance !== null ? parseFloat(balance) : null;

  return (
    <div className="flex shrink-0 items-center justify-between rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5">
      <div className="flex items-center gap-3">
        <Zap className="h-4 w-4 text-indigo-400" />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/90 font-semibold">{ArcTestnet.name}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-indigo-300">Gas: {bal !== null ? (parseFloat(gasPrice).toFixed(4) || "0.0002") : "5"} {ArcTestnet.nativeCurrency.symbol}</span>
          <span className="text-zinc-500">|</span>
          <span className={isConnected ? "text-emerald-400" : "text-amber-400"}>
            Status: {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && address && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 mr-2">
            <span className="font-mono text-indigo-300/70">{address.slice(0, 6)}...{address.slice(-4)}</span>
            <span className="mx-1">|</span>
          </div>
        )}
        {isConnected && bal !== null ? (
          <button
            onClick={disconnect}
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1 text-indigo-300 font-medium">
              {bal.toFixed(2)} {ArcTestnet.nativeCurrency.symbol}
            </span>
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20">
              {isConnected && address ? address[2]?.toUpperCase() : "A"}
            </div>
            <ChevronDown size={14} />
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
          >
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-indigo-600 opacity-90" />
            <span className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-zinc-900/80" />
            <span className="relative z-10 flex items-center gap-2">
              {connecting ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Connect Wallet
                </>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

let gasPrice = "0.00020";

/* ── Send Modal ── */
function SendModal({ onClose }: { onClose: () => void }) {
  const { address, adapter, addTransaction } = useArcWallet();
  const symbol = ArcTestnet.nativeCurrency.symbol;
  const decimals = ArcTestnet.nativeCurrency.decimals;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    if (!recipient || !/0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!adapter) {
      setError("Wallet adapter not initialized");
      return;
    }

    setSending(true);
    try {
      const value = parseUnits(amount, decimals);
      const prepared = await adapter.prepare(
        { address: recipient as `0x${string}`, value },
        { chain: "Arc_Testnet" }
      );
      await prepared.estimate();
      const hash = await prepared.execute();
      addTransaction({ hash, from: address!, to: recipient, amount, status: "confirmed" });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <MotionModal onClose={onClose} title="Send Tokens" Icon={Send}>
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="space-y-3">
        <InputField
          label="Recipient Address"
          placeholder="0x..."
          value={recipient}
          onChange={setRecipient}
        />
        <InputField
          label={`Amount (${symbol})`}
          placeholder="0.00"
          value={amount}
          onChange={setAmount}
          type="number"
          step="0.001"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors btn-micro disabled:opacity-50"
        >
          {sending ? "BROADCASTING..." : `SEND ${symbol}`}
        </button>
      </div>
    </MotionModal>
  );
}

/* ── Receive Modal ── */
function ReceiveModal({ onClose }: { onClose: () => void }) {
  const { address } = useArcWallet();
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MotionModal onClose={onClose} title="Receive" Icon={QrCode}>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={address} size={160} level="M" />
        </div>
        <p className="text-[10px] font-mono text-gray-400 break-all text-center bg-white/5 rounded-lg px-3 py-2">
          {address}
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-xs text-indigo-400"
        >
          {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy Address</>}
        </button>
      </div>
    </MotionModal>
  );
}

/* ── Swap Modal (uses swap-kit) ── */
function SwapModal({ onClose }: { onClose: () => void }) {
  return (
    <MotionModal onClose={onClose} title="Swap" Icon={ArrowRightLeft}>
      <div className="space-y-3">
        <p className="text-xs text-gray-400">
          Swap is available on the dedicated page. Click the button below to swap tokens on Arc Testnet.
        </p>
        <Link href="/swap" onClick={onClose}>
          <span className="block w-full text-center rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer">
            Go to Swap Page
          </span>
        </Link>
      </div>
    </MotionModal>
  );
}

/* ── Bridge Modal ── */
function BridgeModal({ onClose }: { onClose: () => void }) {
  const { isConnected } = useArcWallet();

  const [amount, setAmount] = useState("");
  const [fromChain, setFromChain] = useState("Ethereum");

  return (
    <MotionModal onClose={onClose} title="Bridge" Icon={Repeat2}>
      <div className="space-y-3">
        <InputField
          label="From Chain"
          placeholder="Ethereum"
          value={fromChain}
          onChange={setFromChain}
        />
        <InputField
          label="Amount (ETH)"
          placeholder="0.00"
          value={amount}
          onChange={setAmount}
          type="number"
          step="0.001"
        />
        <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-2 text-[10px] text-indigo-300/70 flex items-center gap-1">
          <ArrowDownLeft className="h-2.5 w-2.5" />
          To: {ArcTestnet.nativeCurrency.symbol} on {ArcTestnet.name}
        </div>
        {!isConnected && (
          <p className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Connect your wallet to bridge
          </p>
        )}
      </div>
    </MotionModal>
  );
}

/* ── Modal Wrapper ── */
function MotionModal({ onClose, title, Icon, children }: {
  onClose: () => void;
  title: string;
  Icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="mx-4 max-w-md w-full rounded-2xl bg-zinc-900 backdrop-blur-md border border-zinc-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white btn-micro">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ── Input Field ── */
function InputField({ label, value, onChange, placeholder, type = "text", step }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* ── Main Dashboard ── */
/* ═══════════════════════════════════════════════════════ */

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<ActionKey>(null);
  const { isConnected } = useArcWallet();

  return (
    <>
      <div className="flex flex-col gap-4 min-h-full p-4">
        <TopBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          <PortfolioSummary />
          <QuickActionPanel
            onAction={setActiveModal}
            disabled={!isConnected}
          />
        </div>

        <AssetPortfolio />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentTransactions />
          <NetworkMonitor />
        </div>
      </div>

      <AnimatePresence>
        {activeModal === "send" && <SendModal onClose={() => setActiveModal(null)} />}
        {activeModal === "receive" && <ReceiveModal onClose={() => setActiveModal(null)} />}
        {activeModal === "swap" && <SwapModal onClose={() => setActiveModal(null)} />}
        {activeModal === "bridge" && <BridgeModal onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
    </>
  );
}
