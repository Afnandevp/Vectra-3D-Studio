import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useIsMounted } from '../../hooks/useIsMounted';

export const AuthButton: React.FC = () => {
  const isMounted = useIsMounted();
  const { address, isConnected, isConnecting, status } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false);

  // Target the Web3Auth connector directly (opens the full Web3Auth login modal)
  const web3AuthConnector = connectors.find((c) => c.id === 'web3auth') || connectors[0];
  const injectedConnector = connectors.find((c) => c.id === 'injected');

  // Silently sync existing authorized MetaMask sessions on initial mount
  useEffect(() => {
    if (!isMounted || hasManuallyDisconnected || isConnected) return;

    if (typeof window !== 'undefined' && (window as any).ethereum && injectedConnector) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            connect({ connector: injectedConnector });
          }
        })
        .catch(() => {});
    }
  }, [isMounted, isConnected, hasManuallyDisconnected, injectedConnector, connect]);

  const handleConnect = () => {
    setHasManuallyDisconnected(false);
    if (web3AuthConnector) {
      connect({ connector: web3AuthConnector });
    }
  };

  const handleDisconnect = () => {
    setHasManuallyDisconnected(true);
    disconnect();
  };

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const isLoading = !isMounted || isConnecting || isPending || status === 'reconnecting';

  // 1. Loading / Hydration State: Visually identical pill during initial mount or connecting
  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white/50 select-none shrink-0"
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50 shrink-0" />
        <span className="font-mono text-xs">Connecting...</span>
      </div>
    );
  }

  // 2. Connected State: Truncated Address pill with click-to-disconnect
  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        className="group flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white/80 hover:bg-white/10 hover:border-white/20 transition-all select-none cursor-pointer shrink-0"
        title="Click to disconnect"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-red-400 transition-colors shrink-0" />
        <span className="font-mono text-white/90">{truncatedAddress}</span>
        <LogOut className="w-3 h-3 text-white/40 group-hover:text-red-400 transition-colors hidden sm:inline shrink-0" />
      </button>
    );
  }

  // 3. Disconnected State: Standard Connect Wallet button to trigger the Web3Auth modal
  return (
    <button
      type="button"
      onClick={handleConnect}
      className="px-3.5 py-1.5 text-xs text-black bg-white hover:bg-white/90 font-medium rounded-full shrink-0 transition-colors flex items-center gap-2 cursor-pointer select-none shadow-sm"
      title="Connect with Web3Auth & MetaMask"
    >
      <Wallet className="w-3.5 h-3.5 text-black shrink-0" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default AuthButton;
