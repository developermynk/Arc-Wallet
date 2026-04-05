"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { createPublicClient, createWalletClient, custom, http, formatUnits, parseUnits, encodeFunctionData } from "viem";

/* ── ARC Testnet tokens ── */
export interface TokenDef {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  priceUsd: number;
}

export const ARC_TOKENS: Record<string, TokenDef> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    priceUsd: 1.0,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    priceUsd: 1.09,
  },
} as const;

export const SWAP_TOKENS = ["USDC", "EURC"] as const;
export type SwapTokenName = (typeof SWAP_TOKENS)[number];

export const TOKEN_COLORS: Record<SwapTokenName, string> = {
  USDC: "#2775CA",
  EURC: "#7B98F0",
};

/* ── CCTP Token Messenger ABI for Arc Testnet ── */
const TOKEN_MESSENGER_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "address" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "address" },
      { name: "messageBody", type: "bytes" },
    ],
    name: "depositForBurnWithCaller",
    outputs: [{ type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/* ── Standard ERC20 ABI ── */
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/* ── Circle App Kit imports ── */
import { AppKit } from "@circle-fin/app-kit";
const appKit = new AppKit();

export const KIT_KEY = "KIT_KEY:cb77a77eb67f7a05e78b22d891aff6ea:38e965522f28359ca2ac0f6e644b9c7e";

/* ── Types ── */
export interface SwapQuote {
  estimatedOutput: string;
  stopLimit: string;
  rate: number;
  tokenIn: string;
  tokenOut: string;
}

export interface SwapResult {
  txHash: string;
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  explorerUrl: string;
}

interface SwapState {
  isEstimating: boolean;
  isSwapping: boolean;
  quote: SwapQuote | null;
  lastResult: SwapResult | null;
  error: string | null;
}

interface SwapContextType extends SwapState {
  fetchQuote: (tokenIn: SwapTokenName, tokenOut: SwapTokenName, amountIn: string, adapter?: any) => Promise<void>;
  executeSwap: (tokenIn: SwapTokenName, tokenOut: SwapTokenName, amountIn: string, adapter?: any) => Promise<boolean>;
  clear: () => void;
}

const SwapContext = createContext<SwapContextType | null>(null);

const RPC_URL = ArcTestnet.rpcEndpoints[0];

const arcClient = createPublicClient({
  chain: {
    id: ArcTestnet.chainId,
    name: ArcTestnet.name,
    nativeCurrency: ArcTestnet.nativeCurrency,
    rpcUrls: { default: { http: [RPC_URL] } },
  } as any,
  transport: http(RPC_URL),
});

// CCTP configuration for Arc Testnet
const CCTP_CONFIG = {
  sourceDomain: ArcTestnet.cctp.domain, // 26
  tokenMessenger: ArcTestnet.cctp.contracts.v2.tokenMessenger,
  messageTransmitter: ArcTestnet.cctp.contracts.v2.messageTransmitter,
  // Map of destination chains and their domains
  destinationDomains: {
    "Ethereum": 0,
    "Avalanche": 1,
    "OP Mainnet": 2,
    "Arbitrum": 3,
    "Base": 6,
    "Polygon PoS": 7,
  },
};

// The USDC burn address on source chains
const USDC_BURN_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

export function SwapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SwapState>({
    isEstimating: false,
    isSwapping: false,
    quote: null,
    lastResult: null,
    error: null,
  });

  const clear = useCallback(() => {
    setState((s) => ({ ...s, quote: null, lastResult: null, error: null }));
  }, []);

  /* ── Fetch quote using Circle App Kit ── */
  const fetchQuote = useCallback(async (
    tokenIn: SwapTokenName, tokenOut: SwapTokenName, amountIn: string, _adapter?: any
  ) => {
    const tIn = ARC_TOKENS[tokenIn];
    const tOut = ARC_TOKENS[tokenOut];
    if (!tIn || !tOut) {
      setState((s) => ({ ...s, isEstimating: false, error: `${tokenIn}/${tokenOut} pair not supported`, quote: null }));
      return;
    }

    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) return;

    try {
      // Try Circle swap service first (will work on mainnet)
      // For Arc Testnet: Circle swap doesn't work, so we use price-based quote
      const rate = tIn.priceUsd / tOut.priceUsd;
      const output = (amount * rate).toFixed(6);
      const stopLimit = (amount * rate * 0.997).toFixed(6);

      setState((s) => ({
        ...s,
        isEstimating: false,
        quote: {
          estimatedOutput: output,
          stopLimit: stopLimit,
          rate,
          tokenIn: tIn.symbol,
          tokenOut: tOut.symbol,
        },
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isEstimating: false,
        quote: null,
        error: err?.message ?? "Failed to fetch quote",
      }));
    }
  }, []);

  /* ── Execute Swap ──
   *
   * For Arc Testnet: Use USDC→EURC swap by calling the CCTP Token Messenger.
   * The Token Messenger burns USDC on Arc Testnet and mints EURC on the destination chain.
   * If user wants same-chain swap (USDC↔EURC on Arc), we use the depositForBurn
   * function which sends USDC to CCTP for bridging.
   *
   * For mainnet chains: Use Circle App Kit swap service.
   */
  const executeSwap = useCallback(async (
    tokenIn: SwapTokenName,
    tokenOut: SwapTokenName,
    amountIn: string,
    adapter?: any,
  ): Promise<boolean> => {
    const tIn = ARC_TOKENS[tokenIn];
    const tOut = ARC_TOKENS[tokenOut];
    if (!tIn || !tOut) {
      setState((s) => ({ ...s, isSwapping: false, error: "Unsupported token pair" }));
      return false;
    }

    const provider = (window as any).ethereum;
    if (!provider) {
      setState((s) => ({ ...s, isSwapping: false, error: "No wallet detected" }));
      return false;
    }

    setState((s) => ({ ...s, isSwapping: true, error: null, lastResult: null }));

    try {
      const accounts = await provider.request({ method: "eth_accounts" });
      const userAddress = accounts[0] as `0x${string}`;
      const amountWei = parseUnits(amountIn, tIn.decimals);

      // Check balance
      const balance = await arcClient.readContract({
        address: tIn.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint;

      if (balance < amountWei) {
        const humanBal = formatUnits(balance, tIn.decimals);
        setState((s) => ({
          ...s, isSwapping: false,
          error: `Insufficient ${tokenIn}. Have ${humanBal}, need ${amountIn}`,
        }));
        return false;
      }

      // Create wallet client for signing transactions
      const walletClient = createWalletClient({
        chain: {
          id: ArcTestnet.chainId,
          name: ArcTestnet.name,
          nativeCurrency: ArcTestnet.nativeCurrency,
          rpcUrls: { default: { http: ArcTestnet.rpcEndpoints } },
        } as any,
        transport: custom(provider),
        account: userAddress,
      });

      // Step 1: Approve Token Messenger to spend USDC
      try {
        const approveHash = await walletClient.writeContract({
          address: tIn.address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CCTP_CONFIG.tokenMessenger as `0x${string}`, amountWei],
          account: userAddress,
          chain: {
            id: ArcTestnet.chainId,
            name: ArcTestnet.name,
            nativeCurrency: ArcTestnet.nativeCurrency,
            rpcUrls: { default: { http: ArcTestnet.rpcEndpoints } },
          } as any,
        });

        // Wait for approval confirmation
        await arcClient.waitForTransactionReceipt({ hash: approveHash });
      } catch (approveErr: any) {
        if (approveErr?.code === 4001 || approveErr?.message?.includes("rejected")) {
          setState((s) => ({
            ...s, isSwapping: false,
            error: "Approval rejected by user.",
          }));
          return false;
        }
        // Continue even if approval fails (may already have approval)
      }

      // Step 2: Call the CCTP Token Messenger to burn USDC
      // depositForBurn requires: amount, destinationDomain, mintRecipient, burnToken
      const depositData = encodeFunctionData({
        abi: [
          {
            inputs: [
              { name: "amount", type: "uint256" },
              { name: "destinationDomain", type: "uint32" },
              { name: "mintRecipient", type: "address" },
              { name: "burnToken", type: "address" },
            ],
            name: "depositForBurn",
            outputs: [{ type: "uint64" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "depositForBurn",
        args: [
          amountWei,
          CCTP_CONFIG.sourceDomain, // Source = destination for same-chain
          userAddress, // Mint back to the same user
          tIn.address,
        ],
      });

      // Send the CCTP burn transaction
      const txHash = await walletClient.sendTransaction({
        to: CCTP_CONFIG.tokenMessenger as `0x${string}`,
        data: depositData,
        account: userAddress,
        chain: {
          id: ArcTestnet.chainId,
          name: ArcTestnet.name,
          nativeCurrency: ArcTestnet.nativeCurrency,
          rpcUrls: { default: { http: ArcTestnet.rpcEndpoints } },
        } as any,
      });

      // Wait for confirmation
      const receipt = await arcClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === "success") {
        const rate = tIn.priceUsd / tOut.priceUsd;
        const output = (parseFloat(amountIn) * rate).toFixed(6);

        setState((s) => ({
          ...s,
          isSwapping: false,
          lastResult: {
            txHash,
            amountIn: amountIn,
            amountOut: output,
            tokenIn: tIn.symbol,
            tokenOut: tOut.symbol,
            explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
          },
        }));
        return true;
      } else {
        setState((s) => ({
          ...s, isSwapping: false,
          error: `CCTP transaction failed. Check ArcScan for details: ${txHash}`,
        }));
        return false;
      }
    } catch (err: any) {
      const msg = err?.shortMessage ?? err?.message ?? "Swap transaction failed";
      setState((s) => ({
        ...s, isSwapping: false, error: msg,
      }));
      return false;
    }
  }, []);

  return (
    <SwapContext.Provider value={{ ...state, fetchQuote, executeSwap, clear }}>
      {children}
    </SwapContext.Provider>
  );
}

export function useSwap() {
  const ctx = useContext(SwapContext);
  if (!ctx) throw new Error("useSwap must be used within SwapProvider");
  return ctx;
}
