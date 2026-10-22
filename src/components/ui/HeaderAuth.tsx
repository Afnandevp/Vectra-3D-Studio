import React, { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWallet, useDisconnect, ConnectButton } from 'thirdweb/react';
import { useAccount, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { Check, LogOut } from 'lucide-react';
import { thirdwebClient, thirdwebWallets, thirdwebTheme } from '../../config/thirdweb';

/**
 * Top Navigation Auth Button
 * - Connected State: Split-pill with Copy Address (left) and Disconnect (right)
 * - Disconnected State: Native Thirdweb ConnectButton with dark mode styling
 */
export const HeaderAuth: React.FC = () => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const { address: wagmiAddress } = useAccount();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();

  const [copied, setCopied] = useState<boolean>(false);

  // Determine active address (Thirdweb in-app or connected wallet, with Wagmi fallback)
  const activeAddress = account?.address || wagmiAddress;

  // Cleanup copied state on unmount or if address changes
  useEffect(() => {
    setCopied(false);
  }, [activeAddress]);

  // Copy full wallet address to clipboard with 2000ms visual confirmation
  const handleCopy = async () => {
    if (!activeAddress) return;
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy address to clipboard:', err);
    }
  };

  // Disconnect from Thirdweb and Wagmi
  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
    }
    try {
      wagmiDisconnect();
    } catch {
      // Wagmi cleanup fallback
    }
  };

  // Truncate address for clean display (e.g. 0x1234...5678)
  const truncatedAddress = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : '';

  // 1. Disconnected State: Return Thirdweb ConnectButton
  if (!activeAddress) {
    return (
      <div className="shrink-0 flex items-center">
        <ConnectButton
          client={thirdwebClient}
          wallets={thirdwebWallets}
          theme={thirdwebTheme}
          connectButton={{
            className:
              '!px-4 !py-1.5 !bg-white/[0.03] !border !border-white/[0.05] !rounded-full !text-xs !text-white/80 hover:!bg-white/10 hover:!text-white !transition-all !cursor-pointer !select-none !font-sans !shadow-none',
            label: 'Connect Wallet',
          }}
          connectModal={{
            size: 'compact',
            title: 'Connect to Vectra',
            showThirdwebBranding: false,
          }}
        />
      </div>
    );
  }

  // 2. Connected State: Split-Pill (Copy Address | Disconnect)
  return (
    <div className="shrink-0 flex items-center">
      <div className="flex items-center bg-white/[0.03] border border-white/[0.05] rounded-full text-xs text-white/80 transition-all divide-x divide-white/10 overflow-hidden shadow-sm">
        {/* Left Zone: Copy Address */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors cursor-pointer select-none"
          title="Click to copy full address"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-mono tracking-tight">{truncatedAddress}</span>
            </>
          )}
        </button>

        {/* Right Zone: Disconnect */}
        <button
          type="button"
          onClick={handleDisconnect}
          className="px-3 py-1.5 hover:bg-white/5 hover:text-white text-white/50 transition-colors cursor-pointer flex items-center justify-center select-none"
          title="Disconnect wallet"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default HeaderAuth;
