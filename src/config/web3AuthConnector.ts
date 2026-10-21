import { createConnector } from 'wagmi';
import { getAddress, UserRejectedRequestError, SwitchChainError } from 'viem';
import type { Web3Auth } from '@web3auth/modal';

export interface Web3AuthConnectorParams {
  web3AuthInstance: Web3Auth;
}

/**
 * Universal Wagmi connector uniting Web3Auth and MetaMask / Injected provider.
 * Automatically synchronizes with already-connected MetaMask accounts on localhost
 * and seamlessly opens the official "Powered by MetaMask" Web3Auth modal when requested.
 */
export function Web3AuthConnector({ web3AuthInstance }: Web3AuthConnectorParams) {
  let initPromise: Promise<void> | null = null;

  const getInjectedEthereum = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return null;
  };

  const ensureInitialized = async () => {
    if (web3AuthInstance.status === 'ready' || web3AuthInstance.status === 'connected') {
      return;
    }
    if (initPromise) {
      return initPromise;
    }

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Web3Auth initialization timed out.')), 8000);
    });

    initPromise = Promise.race([web3AuthInstance.init(), timeoutPromise])
      .catch((err) => {
        initPromise = null;
        console.warn('Web3Auth init warning:', err);
        throw err;
      });

    return initPromise;
  };

  // Eagerly pre-load Web3Auth modal on startup
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

        const injected = getInjectedEthereum();

        // 1. Check if MetaMask is ALREADY authorized on this site (e.g. green dot in extension)
        if (injected) {
          try {
            const currentAccounts = (await injected.request({ method: 'eth_accounts' })) as string[];
            if (currentAccounts && currentAccounts.length > 0) {
              const currentChainId = await this.getChainId();
              const accounts = currentAccounts.map((x) => getAddress(x));

              try {
                injected.on?.('accountsChanged', this.onAccountsChanged);
                injected.on?.('chainChanged', this.onChainChanged);
                injected.on?.('disconnect', this.onDisconnect.bind(this));
              } catch (e) {
                console.warn('Could not attach injected listeners:', e);
              }

              return {
                accounts: accounts as any,
                chainId: currentChainId,
              };
            }
          } catch (e) {
            console.warn('Checking existing injected accounts failed, proceeding to modal:', e);
          }
        }

        // 2. If not already connected, ensure modal is initialized and bring to front
        await ensureInitialized();

        if (typeof document !== 'undefined') {
          const container = document.getElementById('w3a-parent-container');
          if (container) {
            container.style.position = 'fixed';
            container.style.zIndex = '999999';
          }
        }

        // 3. Directly launch the official "Powered by MetaMask" login modal
        if (!web3AuthInstance.connected) {
          await web3AuthInstance.connect();
        }

        const provider = (web3AuthInstance.provider || injected) as any;
        if (!provider) {
          // If modal completed, try checking if injected accounts were granted
          if (injected) {
            const newlyGranted = (await injected.request({ method: 'eth_accounts' })) as string[];
            if (newlyGranted && newlyGranted.length > 0) {
              const accounts = newlyGranted.map((x) => getAddress(x));
              const currentChainId = await this.getChainId();
              return { accounts: accounts as any, chainId: currentChainId };
            }
          }
          throw new UserRejectedRequestError(new Error('User closed login modal.'));
        }

        // 4. Attach event listeners
        try {
          if (provider?.on) {
            provider.on('accountsChanged', this.onAccountsChanged);
            provider.on('chainChanged', this.onChainChanged);
            provider.on('disconnect', this.onDisconnect.bind(this));
          }
        } catch (e) {
          console.warn('Could not attach provider event listeners:', e);
        }

        // 5. Resolve chain ID
        let currentChainId = await this.getChainId();
        if (parameters?.chainId && currentChainId !== parameters.chainId) {
          const chain = await this.switchChain({ chainId: parameters.chainId }).catch(() => ({ id: currentChainId }));
          if (chain?.id) currentChainId = chain.id;
        }

        // 6. Resolve connected account
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
        console.error('Connection error:', error);
        throw error;
      }
    },

    async getAccounts() {
      const injected = getInjectedEthereum();
      // First try Web3Auth's provider, fallback to window.ethereum (MetaMask)
      const provider = (web3AuthInstance.provider || injected) as any;
      if (!provider) return [];
      try {
        const accounts = (await provider.request({ method: 'eth_accounts' })) as `0x${string}`[];
        return accounts && accounts.length ? accounts.map((x) => getAddress(x)) : [];
      } catch {
        return [];
      }
    },

    async getChainId() {
      const injected = getInjectedEthereum();
      const provider = (web3AuthInstance.provider || injected) as any;
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
      return web3AuthInstance.provider || getInjectedEthereum();
    },

    async isAuthorized() {
      try {
        if (web3AuthInstance.connected) return true;
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new Error('Chain not configured'));
      const injected = getInjectedEthereum();
      const provider = (web3AuthInstance.provider || injected) as any;
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
        const injected = getInjectedEthereum();
        const provider = (web3AuthInstance.provider || injected) as any;
        if (provider?.removeListener) {
          provider.removeListener('accountsChanged', this.onAccountsChanged);
          provider.removeListener('chainChanged', this.onChainChanged);
        }
        if (web3AuthInstance.connected) {
          await web3AuthInstance.logout();
        }
      } catch (error) {
        console.warn('Error during logout:', error);
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
