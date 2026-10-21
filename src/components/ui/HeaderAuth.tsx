import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

/**
 * Top Navigation Auth Button using Privy & Wagmi
 * Styled with minimal glassmorphic pill aesthetics.
 */
export const HeaderAuth: React.FC = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    try {
      disconnect();
    } catch {}
    try {
      await logout();
    } catch {}
  };

  // Glassmorphic styling specified by design requirements:
  const pillBaseClass =
    'px-4 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full text-xs text-white/80 hover:bg-white/10 transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer';

  // 1. Initial SDK loading state
  if (!ready) {
    return (
      <div className={`${pillBaseClass} cursor-default opacity-60`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50 shrink-0" />
        <span className="font-mono text-xs">Connecting...</span>
      </div>
    );
  }

  // 2. Authenticated State: Show truncated address, click calls logout()
  if (authenticated && user?.wallet?.address) {
    const address = user.wallet.address;
    const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <button
        type="button"
        onClick={handleLogout}
        className={`${pillBaseClass} hover:border-white/20 hover:text-white group`}
        title="Click to disconnect"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-red-400 transition-colors shrink-0" />
        <span className="font-mono text-white/90">{truncatedAddress}</span>
        <LogOut className="w-3 h-3 text-white/40 group-hover:text-red-400 transition-colors hidden sm:inline shrink-0" />
      </button>
    );
  }

  // 3. Unauthenticated State: Show "Connect Wallet", click calls login()
  return (
    <button
      type="button"
      onClick={login}
      className={`${pillBaseClass} hover:border-white/20 hover:text-white`}
      title="Connect with Privy (Email, Google, Wallet)"
    >
      <Wallet className="w-3.5 h-3.5 text-white/80 shrink-0" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default HeaderAuth;
