import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, fallback } from 'viem';
import {
  BALANCE_OF_ABI,
  baseChain,
  robinhoodTestnet,
  monadNetwork,
  GATED_MULTI_CHAIN_ASSETS,
} from '../config/tokenConfig';
import { useLogoStore } from '../store/useLogoStore';

export interface TokenGateState {
  /** True if the user holds at least one qualifying asset on Robinhood, Monad, or Base AND has verified in the active session */
  hasAccess: boolean;
  /** True if the live wallet balance check confirms holding at least 1 asset */
  isHoldingEligibleAsset: boolean;
  /** True if user has verified during this active browser session (starts false on refresh/revisit) */
  isSessionVerified: boolean;
  /** True while verification queries across chains are active */
  isChecking: boolean;
  /** Wallet connection state */
  isConnected: boolean;
  /** Connected wallet address */
  address?: `0x${string}`;
  /** List of asset IDs confirmed with positive balance */
  heldAssetIds: string[];
  /** Breakdown of native Robinhood Testnet ETH balance */
  nativeRobinhoodEth?: bigint;
  /** Trigger manual refresh across all contracts and native balance */
  refetch: () => Promise<void>;
  /** Mark session as verified (called when clicking 'Proceed to Export') */
  confirmSessionVerification: () => void;
  /** Reset session verification (e.g. on disconnect or account switch) */
  resetSessionVerification: () => void;
}

// Resilient public clients with robust RPC fallbacks
const baseClient = createPublicClient({
  chain: baseChain,
  transport: fallback([
    http('https://mainnet.base.org'),
    http('https://1rpc.io/base'),
    http('https://base.llamarpc.com'),
  ]),
});

const robinhoodClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: fallback([
    http('https://rpc.testnet.chain.robinhood.com'),
  ]),
});

const monadClient = createPublicClient({
  chain: monadNetwork,
  transport: fallback([
    http('https://rpc-mainnet.monadinfra.com'),
    http('https://rpc3.monad.xyz'),
  ]),
});


/**
 * Direct low-latency JSON-RPC eth_call balance query with 4s abort controller.
 * Eliminates Viem fallback health-check ping overhead and CORS delays.
 */
async function fetchErc20BalanceDirect(
  rpcUrls: string[],
  contractAddress: string,
  userAddress: string
): Promise<bigint> {
  const cleanUser = userAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  const callData = `0x70a08231${cleanUser}`;

  for (const rpc of rpcUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: contractAddress, data: callData }, 'latest'],
        }),
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.result && json.result !== '0x') {
          const bal = BigInt(json.result);
          if (bal > 0n) return bal;
        }
      }
    } catch {
      // Continue to next RPC
    }
  }

  // Also query directly through window.ethereum provider if active
  if (typeof window !== 'undefined' && (window as any).ethereum?.request) {
    try {
      const raw = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: callData }, 'latest'],
      });
      if (raw && raw !== '0x') {
        const bal = BigInt(raw);
        if (bal > 0n) return bal;
      }
    } catch {
      // Ignore
    }
  }

  return 0n;
}

/**
 * Multi-chain verification hook that reliably queries contract balances (ERC-20 / ERC-721)
 * across Robinhood Chain Testnet, Monad Mainnet, and Base Mainnet, plus native Robinhood Testnet ETH.
 * 
 * Features strict Session-Based Verification:
 * On every page refresh or revisit, `isSessionVerified` starts as `false`.
 * Users must verify that they are holding qualifying assets in the modal before full export access is unlocked.
 */
export function useTokenGate(): TokenGateState {
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();

  // Also support injected address directly if Wagmi's session sync is in-flight
  const [injectedAddress, setInjectedAddress] = useState<`0x${string}` | undefined>(undefined);

  // In-memory session verification state (resets on page reload / revisit)
  const isSessionVerified = useLogoStore((s) => s.isSessionVerified);
  const setIsSessionVerified = useLogoStore((s) => s.setIsSessionVerified);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            setInjectedAddress(accounts[0] as `0x${string}`);
          }
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts[0]) {
          setInjectedAddress(accounts[0] as `0x${string}`);
        } else {
          setInjectedAddress(undefined);
        }
        // Account changed -> require re-verification
        setIsSessionVerified(false);
      };

      eth.on?.('accountsChanged', handleAccountsChanged);
      return () => {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [setIsSessionVerified]);

  const activeAddress = (wagmiAddress || injectedAddress) as `0x${string}` | undefined;
  const isConnected = Boolean(isWagmiConnected || (injectedAddress && injectedAddress.length === 42));

  // Invalidate session verification if address changes or disconnects
  const prevAddressRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevAddressRef.current !== undefined && prevAddressRef.current !== activeAddress) {
      setIsSessionVerified(false);
    }
    prevAddressRef.current = activeAddress;
  }, [activeAddress, setIsSessionVerified]);

  const [heldAssetIds, setHeldAssetIds] = useState<string[]>([]);
  const [nativeRobinhoodEth, setNativeRobinhoodEth] = useState<bigint | undefined>(undefined);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const isCheckingRef = useRef(false);

  const checkBalances = useCallback(async () => {
    if (!activeAddress || !isConnected) {
      setHeldAssetIds([]);
      setNativeRobinhoodEth(undefined);
      setIsChecking(false);
      return;
    }

    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const user = activeAddress;
      const detectedIds: string[] = [];

      // 1. Check Native Robinhood Testnet ETH
      const checkRhEth = robinhoodClient
        .getBalance({ address: user })
        .then((bal) => {
          setNativeRobinhoodEth(bal);
          if (bal > 0n) {
            detectedIds.push('native-rh-eth');
          }
        })
        .catch(() => {
          // Non-blocking on network failure
        });

      // 2. Check Robinhood Chain Testnet ERC-20 Tokens (VCT, vibe, TSLA, AMZN, AMD)
      const rhTokenChecks = GATED_MULTI_CHAIN_ASSETS.filter(
        (a) => a.chainName === 'Robinhood'
      ).map(async (asset) => {
        try {
          const bal = (await robinhoodClient.readContract({
            address: asset.address,
            abi: BALANCE_OF_ABI,
            functionName: 'balanceOf',
            args: [user],
          })) as bigint;

          if (bal > 0n) {
            detectedIds.push(asset.id);
            setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
          }
        } catch {
          // Graceful handling of individual asset RPC latency
        }
      });

      // 3. Check Monad Mainnet & Testnet Assets (Chog Token, Chog NFT)
      const monadRpcs = [
        'https://rpc-mainnet.monadinfra.com',
        'https://rpc3.monad.xyz',
        'https://rpc.ankr.com/monad_testnet',
        'https://rpc-testnet.monadinfra.com',
      ];

      const monadTokenChecks = GATED_MULTI_CHAIN_ASSETS.filter(
        (a) => a.chainName === 'Monad'
      ).map(async (asset) => {
        // Step A: Ultra-fast direct JSON-RPC query on live Monad nodes
        try {
          const directBal = await fetchErc20BalanceDirect(monadRpcs, asset.address, user);
          if (directBal > 0n) {
            detectedIds.push(asset.id);
            setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
            return;
          }
        } catch {
          // Continue to next check
        }

        // Step B: For Chog Token, also check known alternative testnet/community contract
        if (asset.id === 'chog-token') {
          try {
            const chogAltBal = await fetchErc20BalanceDirect(
              monadRpcs,
              '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
              user
            );
            if (chogAltBal > 0n) {
              detectedIds.push(asset.id);
              setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
              return;
            }
          } catch {
            // Ignored
          }
        }

        // Step C: Viem client readContract as secondary verification
        try {
          const bal = (await monadClient.readContract({
            address: asset.address,
            abi: BALANCE_OF_ABI,
            functionName: 'balanceOf',
            args: [user],
          })) as bigint;

          if (bal > 0n) {
            detectedIds.push(asset.id);
            setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
            return;
          }
        } catch {
          // Viem fallback
        }

        // Step D: Fallback check on Base in case user holds cross-chain replica
        try {
          const baseBal = (await baseClient.readContract({
            address: asset.address,
            abi: BALANCE_OF_ABI,
            functionName: 'balanceOf',
            args: [user],
          })) as bigint;

          if (baseBal > 0n) {
            detectedIds.push(asset.id);
            setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
          }
        } catch {
          // Ignored
        }
      });

      // 4. Check Base Mainnet Assets (Spark Token)
      const baseTokenChecks = GATED_MULTI_CHAIN_ASSETS.filter(
        (a) => a.chainName === 'Base'
      ).map(async (asset) => {
        try {
          const bal = (await baseClient.readContract({
            address: asset.address,
            abi: BALANCE_OF_ABI,
            functionName: 'balanceOf',
            args: [user],
          })) as bigint;

          if (bal > 0n) {
            detectedIds.push(asset.id);
            setHeldAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
          }
        } catch {
          // Graceful handling of individual asset RPC latency
        }
      });

      // Execute all checks in parallel with zero mutual blockage
      await Promise.allSettled([
        checkRhEth,
        ...rhTokenChecks,
        ...monadTokenChecks,
        ...baseTokenChecks,
      ]);

      setHeldAssetIds([...new Set(detectedIds)]);
    } catch (err) {
      console.warn('Asset verification check encountered an issue:', err);
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, [activeAddress, isConnected]);

  // Trigger check whenever address or connection status changes
  useEffect(() => {
    if (activeAddress && isConnected) {
      checkBalances();
    } else {
      setHeldAssetIds([]);
      setNativeRobinhoodEth(undefined);
    }
  }, [activeAddress, isConnected, checkBalances]);

  // Periodic background re-check (every 10 seconds)
  useEffect(() => {
    if (!activeAddress || !isConnected) return;
    const interval = setInterval(() => {
      checkBalances();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeAddress, isConnected, checkBalances]);

  const isHoldingEligibleAsset = Boolean(isConnected && heldAssetIds.length > 0);
  // Full export access is unlocked ONLY when holding qualifying assets AND verified in this session
  const hasAccess = Boolean(isHoldingEligibleAsset && isSessionVerified);

  const confirmSessionVerification = useCallback(() => {
    setIsSessionVerified(true);
  }, [setIsSessionVerified]);

  const resetSessionVerification = useCallback(() => {
    setIsSessionVerified(false);
  }, [setIsSessionVerified]);

  return {
    hasAccess,
    isHoldingEligibleAsset,
    isSessionVerified,
    isChecking,
    isConnected,
    address: activeAddress,
    heldAssetIds,
    nativeRobinhoodEth,
    refetch: checkBalances,
    confirmSessionVerification,
    resetSessionVerification,
  };
}

export default useTokenGate;
