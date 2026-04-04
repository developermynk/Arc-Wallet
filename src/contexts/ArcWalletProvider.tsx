"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  createViemAdapterFromProvider,
} from "@circle-fin/adapter-viem-v2";
import { ArcTestnet, Ethereum, Polygon, Avalanche, Arbitrum, Optimism, Base } from "@circle-fin/app-kit/chains";
import { createPublicClient, http, formatUnits } from "viem";

const STORAGE_KEY = "arc_wallet_connected_address";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'confirmed' | 'failed';
}

export interface Erc20Token {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export interface Erc20Balance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUsd: number;
  priceUsd24hAgo: number;
  contractAddress: string;
}

export interface NftAsset {
  name: string;
  symbol: string;
  contractAddress: string;
  balance: string;
  tokenType: string;
  imageUrl: string;
}

interface ArcWalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  connecting: boolean;
  adapter: any | null;
  transactions: Transaction[];
  nfts: NftAsset[];
  tokens: Erc20Token[];
  erc20Balances: Erc20Balance[];
}

interface ArcWalletContextType extends ArcWalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  addTransaction: (tx: Omit<Transaction, 'timestamp'>) => void;
}

const ArcWalletContext = createContext<ArcWalletContextType | null>(null);

const rpcUrl = ArcTestnet.rpcEndpoints[0];
const ARCSCAN_API = "https://testnet.arcscan.app/api";

// ERC20 token definitions on Arc Testnet (fill contractAddress after deployment)
const ERC20_TOKENS: Array<{
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUsd: number;
  priceUsd24hAgo: number;
}> = [
  {
    contractAddress: "0x3600000000000000000000000000000000000000",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    priceUsd: 1,
    priceUsd24hAgo: 0.998,
  },
  {
    contractAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    symbol: "EURC",
    name: "EURC",
    decimals: 6,
    priceUsd: 1.09,
    priceUsd24hAgo: 1.085,
  },
];

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface ArcScanTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
}

export function ArcWalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ArcWalletState>({
    address: null,
    balance: null,
    isConnected: false,
    connecting: false,
    adapter: null,
    transactions: [],
    nfts: [],
    tokens: [],
    erc20Balances: [],
  });

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const client = createPublicClient({
        chain: {
          id: ArcTestnet.chainId,
          name: ArcTestnet.name,
          nativeCurrency: ArcTestnet.nativeCurrency,
          rpcUrls: { default: { http: [rpcUrl] } },
        } as any,
        transport: http(rpcUrl),
      });
      const balance = await client.getBalance({ address: address as any });
      return formatUnits(balance, ArcTestnet.nativeCurrency.decimals);
    } catch {
      return "0";
    }
  }, []);

  const fetchErc20Balances = useCallback(async (address: string): Promise<Erc20Balance[]> => {
    const client = createPublicClient({
      chain: {
        id: ArcTestnet.chainId,
        name: ArcTestnet.name,
        nativeCurrency: ArcTestnet.nativeCurrency,
        rpcUrls: { default: { http: [rpcUrl] } },
      } as any,
      transport: http(rpcUrl),
    });
    const results = await Promise.all(
      ERC20_TOKENS.map(async (t) => {
        try {
          const balance = await client.readContract({
            address: t.contractAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          });
          const [decimals, symbol] = await Promise.all([
            client.readContract({ address: t.contractAddress as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" }),
            client.readContract({ address: t.contractAddress as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" }),
          ]);
          const dec = (decimals as number) ?? t.decimals;
          const sym = (symbol as string) ?? t.symbol;
          return {
            symbol: sym,
            name: sym,
            balance: formatUnits(balance as bigint, dec),
            decimals: dec,
            priceUsd: t.priceUsd,
            priceUsd24hAgo: t.priceUsd24hAgo,
            contractAddress: t.contractAddress,
          };
        } catch (err) {
          console.error(`Failed to fetch ${t.symbol} balance:`, err);
          return {
            symbol: t.symbol,
            name: t.name,
            balance: "0",
            decimals: t.decimals,
            priceUsd: t.priceUsd,
            priceUsd24hAgo: t.priceUsd24hAgo,
            contractAddress: t.contractAddress,
          };
        }
      })
    );
    return results;
  }, []);

  const fetchTransactions = useCallback(async (address: string): Promise<Transaction[]> => {
    try {
      const res = await fetch(
        `${ARCSCAN_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`
      );
      const data = await res.json();
      if (data?.result?.length > 0) {
        return (data.result as ArcScanTx[])
          .filter((tx: ArcScanTx) => tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase())
          .map((tx: ArcScanTx) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: formatUnits(
              BigInt(tx.value),
              ArcTestnet.nativeCurrency.decimals
            ),
            timestamp: parseInt(tx.timeStamp) * 1000,
            status: tx.isError === "0" ? ("confirmed" as const) : ("failed" as const),
          }));
      }
    } catch {
    }
    return [];
  }, []);

  const fetchNfts = useCallback(async (address: string): Promise<NftAsset[]> => {
    try {
      const res = await fetch(
        `${ARCSCAN_API}?module=account&action=tokenlist&address=${address}`
      );
      const data = await res.json();
      if (data?.result?.length > 0) {
        await Promise.all(
          (data.result as any[])
            .filter((t: any) => t.type === "ERC-721" && t.balance)
            .map(async (t: any) => {
              const client = createPublicClient({
                chain: {
                  id: ArcTestnet.chainId,
                  name: ArcTestnet.name,
                  nativeCurrency: ArcTestnet.nativeCurrency,
                  rpcUrls: { default: { http: [rpcUrl] } },
                } as any,
                transport: http(rpcUrl),
              });
              try {
                const tokenUrl = await client.readContract({
                  address: t.contractAddress as `0x${string}`,
                  abi: [{
                    inputs: [{ name: "tokenId", type: "uint256" }],
                    name: "tokenURI",
                    outputs: [{ type: "string" }],
                    stateMutability: "view",
                    type: "function",
                  }],
                  functionName: "tokenURI",
                  args: [BigInt(0)],
                });
                const metadataUrl = tokenUrl.startsWith("ipfs://")
                  ? `https://gateway.pinata.cloud/ipfs/${tokenUrl.slice(7)}`
                  : tokenUrl;
                const metadataRes = await fetch(metadataUrl);
                const metadata = await metadataRes.json();
                const imageUrl = metadata?.image
                  ? metadata.image.startsWith("ipfs://")
                    ? `https://gateway.pinata.cloud/ipfs/${metadata.image.slice(7)}`
                    : metadata.image
                  : "";
                t.imageUrl = imageUrl;
                t.name = metadata?.name || t.name;
              } catch {
                t.imageUrl = "";
              }
            })
        );
        return (data.result as any[])
          .filter((t: any) => t.type === "ERC-721" && t.balance)
          .map((t: any) => ({
            name: t.name,
            symbol: t.symbol,
            contractAddress: t.contractAddress,
            balance: t.balance,
            tokenType: t.type,
            imageUrl: t.imageUrl,
          }));
      }
    } catch {
    }
    return [];
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("No browser wallet detected. Please install MetaMask or similar.");
      return;
    }

    setState((s) => ({ ...s, connecting: true }));

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0] as string;
      const [balance, txs, nfts, erc20Balances] = await Promise.all([
        fetchBalance(address),
        fetchTransactions(address),
        fetchNfts(address),
        fetchErc20Balances(address),
      ]);

      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum,
        capabilities: {
          addressContext: "user-controlled" as const,
          supportedChains: [ArcTestnet, Ethereum, Polygon, Avalanche, Arbitrum, Optimism, Base],
        },
      });

      setState({
        address,
        balance,
        isConnected: true,
        connecting: false,
        adapter,
        transactions: txs,
        nfts,
        tokens: [],
        erc20Balances,
      });
      sessionStorage.setItem(STORAGE_KEY, address);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setState((s) => ({ ...s, connecting: false }));
    }
  }, [fetchBalance, fetchTransactions, fetchNfts, fetchErc20Balances]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      isConnected: false,
      connecting: false,
      adapter: null,
      transactions: [],
      nfts: [],
      tokens: [],
      erc20Balances: [],
    });
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'timestamp'>) => {
    const newTx: Transaction = { ...tx, timestamp: Date.now() };
    setState((s) => ({ ...s, transactions: [newTx, ...s.transactions] }));
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved || !window.ethereum) return;

    const reconnect = async () => {
      setState((s) => ({ ...s, connecting: true }));
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0] as string;
        const [balance, txs, nfts, erc20Balances] = await Promise.all([
          fetchBalance(address),
          fetchTransactions(address),
          fetchNfts(address),
          fetchErc20Balances(address),
        ]);

        const adapter = await createViemAdapterFromProvider({
          provider: window.ethereum,
          capabilities: {
            addressContext: "user-controlled" as const,
            supportedChains: [ArcTestnet, Ethereum, Polygon, Avalanche, Arbitrum, Optimism, Base],
          },
        });

        setState({
          address,
          balance,
          isConnected: true,
          connecting: false,
          adapter,
          transactions: txs,
          nfts,
          tokens: [],
          erc20Balances,
        });
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        setState((s) => ({ ...s, connecting: false }));
      }
    };

    reconnect();
  }, [fetchBalance, fetchTransactions, fetchNfts]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const address = accounts[0];
        const [balance, txs, erc20Balances] = await Promise.all([
          fetchBalance(address),
          fetchTransactions(address),
          fetchErc20Balances(address),
        ]);
        setState((s) => ({ ...s, address, balance, transactions: txs, erc20Balances }));
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect, fetchBalance]);

  return (
    <ArcWalletContext.Provider value={{ ...state, connect, disconnect, addTransaction }}>
      {children}
    </ArcWalletContext.Provider>
  );
}

export function useArcWallet() {
  const ctx = useContext(ArcWalletContext);
  if (!ctx) throw new Error("useArcWallet must be used within ArcWalletProvider");
  return ctx;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
