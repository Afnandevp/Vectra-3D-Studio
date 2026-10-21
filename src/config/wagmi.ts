import { createConfig } from '@privy-io/wagmi';
import { http, fallback } from 'wagmi';
import {
  baseChain,
  monadNetwork,
  robinhoodTestnet,
} from './tokenConfig';

/**
 * Multi-chain Wagmi configuration powered by @privy-io/wagmi
 * Natively synchronizes Privy's embedded wallets and external wallets (MetaMask, Coinbase, etc.)
 * across Base Mainnet, Monad Mainnet, and Robinhood Chain Testnet.
 */
export const wagmiConfig = createConfig({
  chains: [baseChain, monadNetwork, robinhoodTestnet],
  transports: {
    [baseChain.id]: http('https://mainnet.base.org'),
    [monadNetwork.id]: fallback([
      http('https://rpc-mainnet.monadinfra.com'),
      http('https://rpc3.monad.xyz'),
    ]),
    [robinhoodTestnet.id]: http('https://rpc.testnet.chain.robinhood.com'),
  },
});

export default wagmiConfig;
