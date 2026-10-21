import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

export const AuthButton: React.FC = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Target the Web3Auth connector directly (opens the full Web3Auth login modal)
  const targetConnector = connectors.find((c) => c.id === 'web3auth') || connectors[0];

  const handleConnect = () => {
    if (targetConnector) {
      connect({ connector: targetConnector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const isLoading = isConnecting || isPending;

  // 1. Connected State: Truncated Address with click-to-disconnect
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

  // 2. Disconnected State: Direct 1-Click Launch of MetaMask / Web3Auth Modal
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleConnect}
      className="px-3.5 py-1.5 text-xs text-black bg-white hover:bg-white/90 font-medium rounded-full shrink-0 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 select-none shadow-sm"
      title="Connect with MetaMask & Web3Auth"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-black shrink-0" />
      ) : (
        <Wallet className="w-3.5 h-3.5 text-black shrink-0" />
      )}
      <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};

export default AuthButton;
