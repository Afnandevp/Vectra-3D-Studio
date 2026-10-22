import { createConfig, http, fallback } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  baseChain,
  monadNetwork,
  robinhoodTestnet,
} from './tokenConfig';

/**
 * Multi-chain Wagmi configuration for token gate RPC balance checks
 * Chains: Base Mainnet, Monad Mainnet, Robinhood Chain Testnet
 */
export const wagmiConfig = createConfig({
  chains: [baseChain, monadNetwork, robinhoodTestnet],
  connectors: [injected()],
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
