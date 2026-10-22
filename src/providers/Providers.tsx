import React from 'react';
import { ThirdwebProvider } from 'thirdweb/react';
import { WagmiProvider } from 'wagmi';
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
 * 1. ThirdwebProvider (Thirdweb v5 SDK - In-App Wallets & Social Auth)
 * 2. WagmiProvider (Wagmi v2 - Multi-Chain RPC Reads & Contract Calls)
 * 3. QueryClientProvider (TanStack React Query)
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ThirdwebProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  );
};

export default Providers;
