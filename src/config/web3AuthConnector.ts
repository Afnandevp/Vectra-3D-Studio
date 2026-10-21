import { createConnector } from 'wagmi';
import { getAddress, UserRejectedRequestError, SwitchChainError } from 'viem';
import type { Web3Auth } from '@web3auth/modal';

export interface Web3AuthConnectorParams {
  web3AuthInstance: Web3Auth;
}

/**
 * Official Web3Auth Wagmi Connector
 * Opens the full Web3Auth modal with Social Login (Google, Discord, Email, Twitter)
 * and External Wallets (MetaMask, Coinbase, WalletConnect).
 */
export function Web3AuthConnector({ web3AuthInstance }: Web3AuthConnectorParams) {
  let initPromise: Promise<void> | null = null;

  const ensureInitialized = async () => {
    if (web3AuthInstance.status === 'ready' || web3AuthInstance.status === 'connected') {
      return;
    }
    if (initPromise) {
      return initPromise;
    }

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Web3Auth initialization timed out.')), 10000);
    });

    const initCall = (web3AuthInstance as any).initModal
      ? (web3AuthInstance as any).initModal()
      : web3AuthInstance.init();

    initPromise = Promise.race([initCall, timeoutPromise]).catch((err) => {
      initPromise = null;
      console.warn('Web3Auth init warning:', err);
      throw err;
    });

    return initPromise;
  };

  // Pre-load Web3Auth modal on startup
  if (typeof window !== 'undefined') {
    ensureInitialized().catch(() => {});
  }

  return createConnector((config) => ({
    id: 'web3auth',
    name: 'Web3Auth',
    type: 'Web3Auth',

    async connect(parameters?: any) {
      try {
        config.emitter.emit('message', { type: 'connecting' });

        await ensureInitialized();

        if (typeof document !== 'undefined') {
          const container = document.getElementById('w3a-parent-container');
          if (container) {
            container.style.position = 'fixed';
            container.style.zIndex = '999999';
          }
        }

        // Open the Web3Auth Modal
        if (!web3AuthInstance.connected) {
          await web3AuthInstance.connect();
        }

        const provider = web3AuthInstance.provider as any;
        if (!provider) {
          throw new UserRejectedRequestError(new Error('User closed login modal.'));
        }

        // Attach event listeners
        try {
          if (provider?.on) {
            provider.on('accountsChanged', this.onAccountsChanged);
            provider.on('chainChanged', this.onChainChanged);
          }
        } catch (e) {
          console.warn('Could not attach provider event listeners:', e);
        }

        let currentChainId = await this.getChainId();
        if (parameters?.chainId && currentChainId !== parameters.chainId) {
          const chain = await this.switchChain({ chainId: parameters.chainId }).catch(() => ({ id: currentChainId }));
          if (chain?.id) currentChainId = chain.id;
        }

        const accounts = await this.getAccounts();
        return {
          accounts: accounts as any,
          chainId: currentChainId,
        };
      } catch (error: any) {
        if (
          error?.name === 'UserRejectedRequestError' ||
          error?.message?.includes('User closed') ||
          error?.message?.includes('rejected')
        ) {
          throw new UserRejectedRequestError(error);
        }
        console.error('Web3Auth connection error:', error);
        throw error;
      }
    },

    async getAccounts() {
      const provider = web3AuthInstance.provider as any;
      if (!provider) return [];
      try {
        const accounts = (await provider.request({ method: 'eth_accounts' })) as `0x${string}`[];
        return accounts && accounts.length ? accounts.map((x) => getAddress(x)) : [];
      } catch {
        return [];
      }
    },

    async getChainId() {
      const provider = web3AuthInstance.provider as any;
      if (!provider) {
        return config.chains[0].id;
      }
      try {
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        return Number(chainIdHex);
      } catch {
        return config.chains[0].id;
      }
    },

    async getProvider() {
      return web3AuthInstance.provider;
    },

    async isAuthorized() {
      try {
        if (web3AuthInstance.connected && web3AuthInstance.provider) {
          const accounts = await this.getAccounts();
          return accounts.length > 0;
        }
        return false;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new Error('Chain not configured'));
      const provider = web3AuthInstance.provider as any;
      try {
        if (web3AuthInstance.connected) {
          await web3AuthInstance.switchChain({
            chainId: `0x${chain.id.toString(16)}`,
          });
        } else if (provider?.request) {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chain.id.toString(16)}` }],
          });
        }
        config.emitter.emit('change', { chainId });
        return chain;
      } catch (error: any) {
        throw new SwitchChainError(error);
      }
    },

    async disconnect() {
      try {
        if (web3AuthInstance.connected) {
          await web3AuthInstance.logout();
        }
      } catch (error) {
        console.warn('Error during Web3Auth logout:', error);
      } finally {
        config.emitter.emit('disconnect');
      }
    },

    onAccountsChanged(accounts: string[]) {
      if (!accounts || accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        });
      }
    },

    onChainChanged(chain: string | number) {
      const chainId = Number(chain);
      config.emitter.emit('change', { chainId });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}

export default Web3AuthConnector;
