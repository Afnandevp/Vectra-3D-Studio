import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/wagmi';

// Singleton QueryClient with optimized cache settings for Web3 queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Universal Providers hierarchy:
 * 1. PrivyProvider (Embedded Wallet & Authentication)
 * 2. QueryClientProvider (TanStack React Query)
 * 3. WagmiProvider (from @privy-io/wagmi to natively sync Privy embedded/external wallets)
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  // Read Privy App ID from environment variable or fallback to developer demo ID
  const appId =
    (import.meta as any).env?.VITE_PRIVY_APP_ID ||
    'clz8926k60032128v5x8b19e4';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#FFFFFF',
          logo: undefined,
          showWalletLoginFirst: false,
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default Providers;
