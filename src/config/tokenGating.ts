import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthConnector } from './web3AuthConnector';
import {
  monadNetwork,
  baseChain,
  robinhoodTestnet,
} from './tokenConfig';

// Re-export all token configs, chain definitions, and ABIs
export * from './tokenConfig';

/**
 * Web3Auth Instance with custom studio dark-mode theming
 */
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: `0x${monadNetwork.id.toString(16)}`,
  rpcTarget: 'https://testnet-rpc.monad.xyz',
  displayName: 'Monad Network',
  blockExplorerUrl: 'https://testnet.monadexplorer.com',
  ticker: 'MON',
  tickerName: 'Monad',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3AuthInstance = new Web3Auth({
  // Web3Auth Dashboard Client ID (configured via ENV or fallback to Sapphire Devnet testing key)
  clientId:
    (import.meta as any).env?.VITE_WEB3AUTH_CLIENT_ID ||
    'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ',
  web3AuthNetwork:
    ((import.meta as any).env?.VITE_WEB3AUTH_NETWORK as any) ||
    WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider as any,
  uiConfig: {
    appName: '3D Studio',
    mode: 'dark',
    theme: {
      primary: '#FFFFFF',
      onPrimary: '#0A0A0A',
    },
    defaultLanguage: 'en',
    modalZIndex: '99999',
  },
});

// Initialize modal on instance
if (!(web3AuthInstance as any).initModal) {
  (web3AuthInstance as any).initModal = function (options?: any) {
    return this.init(options);
  };
}

/**
 * Wagmi Multi-Chain Client Configuration with Web3AuthConnector & Injected fallback
 */
export const wagmiConfig = createConfig({
  chains: [monadNetwork, baseChain, robinhoodTestnet],
  connectors: [
    Web3AuthConnector({
      web3AuthInstance,
    }),
    injected(),
  ],
  transports: {
    [monadNetwork.id]: http('https://rpc.monad.xyz'),
    [baseChain.id]: http('https://mainnet.base.org'),
    [robinhoodTestnet.id]: http('https://rpc.testnet.chain.robinhood.com'),
  },
});
