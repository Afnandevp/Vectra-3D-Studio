import React, { useEffect } from 'react';
import { 
  Lock, 
  X, 
  RefreshCw, 
  Wallet, 
  CheckCircle2, 
  Minus,
  Loader2 
} from 'lucide-react';
import { useConnect, useDisconnect } from 'wagmi';
import { 
  ALL_MULTI_CHAIN_ACCEPTED_ASSETS 
} from '../../config/tokenConfig';
import { useTokenGate } from '../../hooks/useTokenGate';

export interface ExportGateModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired to close modal */
  onClose: () => void;
  /** Attempted export format (.GLB, .MP4, .GIF, .PNG) */
  targetFormat?: string | null;
  /** Callback fired when user is authorized and proceeds */
  onAuthorized?: () => void;
}

export const ExportGateModal: React.FC<ExportGateModalProps> = ({
  isOpen,
  onClose,
  targetFormat,
  onAuthorized,
}) => {
  const { 
    isHoldingEligibleAsset, 
    isChecking, 
    isConnected, 
    address, 
    heldAssetIds,
    refetch,
    confirmSessionVerification
  } = useTokenGate();

  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // Fresh live balance check whenever modal opens
  useEffect(() => {
    if (isOpen && isConnected) {
      refetch();
    }
  }, [isOpen, isConnected, refetch]);

  // Prioritize direct native injected MetaMask connector if available
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const web3AuthConnector = connectors.find((c) => c.id === 'web3auth');
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);
  const targetConnector = (hasInjected ? injectedConnector : web3AuthConnector) || connectors[0];

  // Auto-synchronize if MetaMask is already connected (e.g. green dot in extension)
  useEffect(() => {
    if (!isConnected && typeof window !== 'undefined' && (window as any).ethereum && targetConnector) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            connect({ connector: targetConnector });
          }
        })
        .catch(() => {});
    }
  }, [isConnected, targetConnector, connect]);

  if (!isOpen) return null;

  const handleProceed = () => {
    confirmSessionVerification();
    onAuthorized?.();
    onClose();
  };

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  const handleConnect = () => {
    if (targetConnector) {
      connect({ connector: targetConnector });
    }
  };

  const getChainBadgeStyle = (chainName: 'Monad' | 'Base' | 'Robinhood') => {
    switch (chainName) {
      case 'Monad':
        return 'bg-purple-500/10 text-purple-300/90 border-purple-500/20';
      case 'Base':
        return 'bg-blue-500/10 text-blue-300/90 border-blue-500/20';
      case 'Robinhood':
        return 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Modal Container: Minimal Dark Aesthetic (#0A0A0A with 1px border-white/10) */}
      <div 
        className="relative w-full max-w-[500px] bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col gap-5 text-white/90 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-white/80" />
            </div>
            <div>
              <h3 className="font-mono text-sm tracking-wider text-white font-semibold uppercase">
                ACCESS LOCKED: TOKEN GATE
              </h3>
              <p className="text-[11px] font-mono text-white/40 mt-0.5">
                Robinhood Testnet · Monad · Base
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Subtitle */}
        <p className="text-[12px] text-white/60 leading-relaxed">
          {targetFormat ? (
            <>Exporting studio assets (<span className="font-mono text-white/90 font-medium">.{targetFormat.toUpperCase()}</span>) </>
          ) : (
            <>Exporting studio assets </>
          )}
          requires holding <span className="text-white/90 font-medium">at least one</span> eligible asset across the supported networks. Verification runs across all three chains simultaneously.
        </p>

        {/* Connected Wallet Status Bar */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <div className="text-[11px]">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white/85 font-medium">{truncatedAddress}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                </div>
              ) : (
                <span className="text-white/40 font-mono">No wallet connected</span>
              )}
            </div>
          </div>

          {isConnected ? (
            <button
              type="button"
              onClick={() => disconnect()}
              className="text-[10px] font-mono text-white/40 hover:text-white/80 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleConnect}
              className="px-3 py-1 text-[11px] font-medium rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60 shrink-0" />
              ) : (
                <Wallet className="w-3.5 h-3.5 text-white/70 shrink-0" />
              )}
              <span>{isConnecting ? 'Opening...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>

        {/* Accepted Assets Checklist */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] tracking-[0.14em] uppercase font-mono text-white/40 font-semibold px-0.5 flex items-center justify-between">
            <span>Accepted Assets (Hold ≥ 1 to unlock)</span>
            {isChecking && (
              <span className="flex items-center gap-1 text-white/40 text-[9px] lowercase font-sans">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                verifying...
              </span>
            )}
          </div>

          <div className="border border-white/[0.06] rounded-lg bg-black/50 divide-y divide-white/[0.04] max-h-[230px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
            {ALL_MULTI_CHAIN_ACCEPTED_ASSETS.map((asset) => {
              const isHeld = heldAssetIds.includes(asset.id);

              return (
                <div 
                  key={asset.id}
                  className="px-3.5 py-2.5 flex items-center justify-between text-[12px] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Holding Indicator: Green checkmark if held, subtle dash if 0 */}
                    <div className="w-4 flex items-center justify-center shrink-0">
                      {isHeld ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isConnected && !isChecking ? (
                        <Minus className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[12px] truncate ${isHeld ? 'text-white font-medium' : 'text-white/70'}`}>
                        {asset.name}
                      </span>

                      {/* Minimal Token Badge */}
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/60 shrink-0">
                        {asset.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Network & Contract Standard Badges */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`text-[9px] border px-1.5 py-0.5 rounded-sm font-mono shrink-0 ${getChainBadgeStyle(asset.chainName)}`}>
                      {asset.chainName}
                    </span>
                    <span className="font-mono text-[9px] text-white/35 uppercase px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] shrink-0">
                      {asset.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <span className="text-[10px] text-white/40 font-mono">
            {heldAssetIds.length > 0 
              ? `${heldAssetIds.length} qualifying asset(s) verified` 
              : isConnected 
                ? '0 qualifying assets held' 
                : 'Connect wallet to verify'}
          </span>

          <div className="flex items-center gap-2">
            {isHoldingEligibleAsset ? (
              <button
                type="button"
                onClick={handleProceed}
                className="px-4 py-1.5 rounded-md bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-all shadow-sm cursor-pointer"
              >
                Proceed to Export
              </button>
            ) : (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isChecking || !isConnected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-30 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Re-verify Chains</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExportGateModal;
