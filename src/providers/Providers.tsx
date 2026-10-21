import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/tokenGating';

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
 * Universal Providers wrapper housing WagmiProvider (with Web3Auth)
 * and React Query QueryClientProvider.
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Providers;
