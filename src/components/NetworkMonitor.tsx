"use client";

import { Activity } from "lucide-react";
import { useArcWallet } from "@/contexts/ArcWalletProvider";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPublicClient, http, formatUnits } from "viem";

const rpcUrl = ArcTestnet.rpcEndpoints[0];
const client = createPublicClient({
  chain: {
    id: ArcTestnet.chainId,
    name: ArcTestnet.name,
    nativeCurrency: ArcTestnet.nativeCurrency,
    rpcUrls: { default: { http: [rpcUrl] } },
  } as any,
  transport: http(rpcUrl),
});

/* Approximate validators based on chain docs */
const ARC_TESTNET_VALIDATORS = 3;

export function NetworkMonitor() {
  const { isConnected } = useArcWallet();

  const [blockHeight, setBlockHeight] = useState<string | null>(null);
  const [gasFee, setGasFee] = useState<string | null>(null);
  const [finality, setFinality] = useState<string>("--");
  const [blockTime, setBlockTime] = useState<string>("--");
  const [txCount, setTxCount] = useState<string>("--");
  const [netStatus, setNetStatus] = useState<"live" | "syncing" | "error">("syncing");
  const [lastSync, setLastSync] = useState<string>("--");
  const [errorCount, setErrorCount] = useState(0);

  const prevBlockTime = useRef<number | null>(null);

  const fetchLiveStats = useCallback(async () => {
    try {
      const now = Date.now();

      /* Block number */
      const blockNum = await client.getBlockNumber();
      setBlockHeight(Number(blockNum).toLocaleString());

      /* Gas price */
      const fee = await client.getGasPrice();
      setGasFee(formatUnits(fee, ArcTestnet.nativeCurrency.decimals));

      /* Fetch current block timestamp for finality measurement */
      const currentBlock = await client.getBlock({ blockNumber: blockNum });
      const currentTimestamp = Number(currentBlock.timestamp) * 1000;

      if (prevBlockTime.current !== null) {
        const diff = (now - prevBlockTime.current) / 1000;
        setBlockTime(`${diff.toFixed(1)}s`);
      }
      prevBlockTime.current = currentTimestamp;

      /* Finality: compare chain tip timestamp against current wall clock */
      const age = (now - currentTimestamp) / 1000;
      if (age > 0 && age < 300) {
        setFinality(`${age.toFixed(1)}s`);
      } else {
        setFinality("~3.6s");
      }

      /* Transactions in latest block */
      setTxCount(String(currentBlock.transactions.length));

      /* Status */
      if (age > 0 && age < 120) {
        setNetStatus("live");
        setErrorCount(0);
      } else {
        setNetStatus(errorCount > 3 ? "error" : "syncing");
      }

      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("[NetworkMonitor] RPC fetch failed:", err);
      setErrorCount((c) => c + 1);
      if (errorCount > 3) setNetStatus("error");
      else setNetStatus("syncing");
    }
  }, [errorCount]);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 10000);
    return () => clearInterval(interval);
  }, [fetchLiveStats]);

  const stats = [
    {
      label: "Block Height",
      value: blockHeight || "querying...",
      highlight: netStatus === "live",
    },
    {
      label: "Network Fee (ARC)",
      value: gasFee !== null ? parseFloat(gasFee).toFixed(6) : "--",
      highlight: gasFee !== null,
    },
    {
      label: "Finality Time",
      value: finality,
      highlight: blockHeight !== null,
    },
    {
      label: "Block Time",
      value: blockTime,
      highlight: prevBlockTime.current !== null,
    },
    {
      label: "Tx Count (Latest Block)",
      value: txCount,
      highlight: txCount !== "--",
    },
    {
      label: "Active Validators",
      value: String(ARC_TESTNET_VALIDATORS),
      highlight: true,
    },
    {
      label: "Last Sync",
      value: lastSync,
      highlight: lastSync !== "--",
    },
    {
      label: "Network",
      value: isConnected ? "Connected" : "Disconnected",
      highlight: isConnected,
    },
  ];

  const statusDot = netStatus === "live" ? "bg-emerald-400" : netStatus === "error" ? "bg-red-500" : "bg-amber-400";

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-indigo-400" />
        <div>
          <h2 className="text-sm font-semibold text-white">Network Monitor</h2>
          <p className="text-xs text-indigo-400 font-medium">Arc Network</p>
        </div>
      </div>

      {/* Network terminal panel */}
      <div className="net-panel rounded-xl p-4 font-mono border border-emerald-500/10 bg-[#0a0e17]">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-500/10">
          <div className={`h-2 w-2 rounded-full ${statusDot} ${netStatus === "live" ? "animate-pulse" : ""}`} />
          <span className={`text-xs font-bold ${
            netStatus === "live" ? "text-emerald-500" : netStatus === "error" ? "text-red-500" : "text-amber-500"
          }`}>
            {netStatus === "live" ? "LIVE" : netStatus === "error" ? "OFFLINE" : "SYNCING"}
          </span>
          <span className="text-gray-600 text-xs ml-auto">{ArcTestnet.name}</span>
        </div>

        <div className="flex flex-col gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="nm-label text-xs">{stat.label}</span>
              <span
                className={`text-sm font-semibold ${
                  !stat.value || stat.value === "querying..."
                    ? "text-amber-500/70"
                    : stat.value === "Disconnected" || netStatus === "error"
                    ? "text-red-500"
                    : "text-emerald-500"
                }`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-500/10 net-footer text-xs">
          <span>{">"}</span> refresh every 10s
          <span className="animate-pulse ml-1">█</span>
        </div>
      </div>
    </div>
  );
}
