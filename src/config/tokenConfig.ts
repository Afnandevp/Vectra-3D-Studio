import { defineChain } from 'viem';
import { base } from 'viem/chains';

/**
 * Standard minimal ABI containing solely balanceOf(address)
 * Works for both ERC-20 and ERC-721 contracts.
 */
export const BALANCE_OF_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * 1. Network Definitions
 */

// Base Mainnet (Chain ID: 8453)
export const baseChain = base;

// Robinhood Chain Testnet (Chain ID: 46630)
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Robinhood Chain Test ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.chain.robinhood.com'],
    },
    public: {
      http: ['https://rpc.testnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: { name: 'RH Explorer', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
  testnet: true,
});

// Monad Mainnet (Chain ID: 143)
export const monadNetwork = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.monadinfra.com', 'https://rpc3.monad.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.monadinfra.com', 'https://rpc3.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monadscan', url: 'https://monadscan.com' },
  },
  testnet: false,
});

export const SUPPORTED_CHAINS = [robinhoodTestnet, monadNetwork, baseChain] as const;

/**
 * Contract asset structure for token gating queries
 */
export interface MultiChainTokenConfig {
  id: string;
  name: string;
  symbol: string;
  badge: string;
  group: 'Robinhood' | 'Monad' | 'Base';
  type: 'ERC-20' | 'ERC-721';
  chainId: number;
  chainName: 'Robinhood' | 'Monad' | 'Base';
  address: `0x${string}`;
}

/**
 * Official Gated Token & Contract Registry
 * - All Robinhood assets on Robinhood Chain Testnet (Chain ID: 46630)
 * - Chog Token and Chog NFT on Monad Mainnet (Chain ID: 143)
 * - Spark Token on Base Mainnet (Chain ID: 8453)
 */
export const GATED_MULTI_CHAIN_ASSETS: readonly MultiChainTokenConfig[] = [
  // 1st: Vectra ($VCT) [Robinhood]
  {
    id: 'vct-token',
    name: 'Vectra ($VCT)',
    symbol: '$VCT',
    badge: 'Native Ecosystem',
    group: 'Robinhood',
    type: 'ERC-20',
    chainId: robinhoodTestnet.id,
    chainName: 'Robinhood',
    address: '0x42508d8BC9A91da1352B597572Ee4571283Dc03e',
  },
  // 2nd: Chog NFT [Monad]
  {
    id: 'chog-nft',
    name: 'Chog NFT',
    symbol: 'CHOG-NFT',
    badge: 'Monad Mainnet',
    group: 'Monad',
    type: 'ERC-721',
    chainId: monadNetwork.id,
    chainName: 'Monad',
    address: '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763',
  },
  // 3rd: Spark Token [Base]
  {
    id: 'spark-token',
    name: 'Spark Token',
    symbol: 'SPARK',
    badge: 'Base Mainnet',
    group: 'Base',
    type: 'ERC-20',
    chainId: baseChain.id,
    chainName: 'Base',
    address: '0x0FB07c88Bc6d195c196279523957C004eb868248',
  },
  // 4th: Chog Token [Monad]
  {
    id: 'chog-token',
    name: 'Chog Token',
    symbol: 'CHOG',
    badge: 'Monad Mainnet',
    group: 'Monad',
    type: 'ERC-20',
    chainId: monadNetwork.id,
    chainName: 'Monad',
    address: '0x350035555E10d9AfAF1566AaebfCeD5BA6C27777',
  },
  // 5th: vibe/vibe Token [Robinhood]
  {
    id: 'vibe-token',
    name: 'vibe/vibe Token',
    symbol: '$VIBE',
    badge: 'vibe/vibe',
    group: 'Robinhood',
    type: 'ERC-20',
    chainId: robinhoodTestnet.id,
    chainName: 'Robinhood',
    address: '0xF1f6b050550531226Ee0257FeC4A1E575ff4c341',
  },

  // Remaining Robinhood Stock Tokens
  {
    id: 'stock-tsla',
    name: 'Robinhood Stock (TSLA)',
    symbol: 'TSLA',
    badge: 'Stock',
    group: 'Robinhood',
    type: 'ERC-20',
    chainId: robinhoodTestnet.id,
    chainName: 'Robinhood',
    address: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
  },
  {
    id: 'stock-amzn',
    name: 'Robinhood Stock (AMZN)',
    symbol: 'AMZN',
    badge: 'Stock',
    group: 'Robinhood',
    type: 'ERC-20',
    chainId: robinhoodTestnet.id,
    chainName: 'Robinhood',
    address: '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
  },
  {
    id: 'stock-amd',
    name: 'Robinhood Stock (AMD)',
    symbol: 'AMD',
    badge: 'Stock',
    group: 'Robinhood',
    type: 'ERC-20',
    chainId: robinhoodTestnet.id,
    chainName: 'Robinhood',
    address: '0x71178BAc73cBeb415514eB542a8995b82669778d',
  },
] as const;

/**
 * UI checklist item metadata
 */
export interface AcceptedAssetUIItem {
  id: string;
  name: string;
  symbol: string;
  badge: string;
  type: 'ERC-20' | 'ERC-721' | 'Native';
  chainName: 'Robinhood' | 'Monad' | 'Base';
  isNative?: boolean;
}

/**
 * Complete list of accepted assets displayed in the modal checklist
 */
export const ALL_MULTI_CHAIN_ACCEPTED_ASSETS: readonly AcceptedAssetUIItem[] = [
  // 1st: Vectra ($VCT)
  {
    id: 'vct-token',
    name: 'Vectra ($VCT)',
    symbol: '$VCT',
    badge: 'Native Ecosystem',
    type: 'ERC-20',
    chainName: 'Robinhood',
  },
  // 2nd: Chog NFT
  {
    id: 'chog-nft',
    name: 'Chog NFT',
    symbol: 'CHOG-NFT',
    badge: 'Monad Mainnet',
    type: 'ERC-721',
    chainName: 'Monad',
  },
  // 3rd: Spark Token
  {
    id: 'spark-token',
    name: 'Spark Token',
    symbol: 'SPARK',
    badge: 'Base Mainnet',
    type: 'ERC-20',
    chainName: 'Base',
  },
  // 4th: Chog Token
  {
    id: 'chog-token',
    name: 'Chog Token',
    symbol: 'CHOG',
    badge: 'Monad Mainnet',
    type: 'ERC-20',
    chainName: 'Monad',
  },
  // 5th: vibe/vibe Token
  {
    id: 'vibe-token',
    name: 'vibe/vibe Token',
    symbol: '$VIBE',
    badge: 'vibe/vibe',
    type: 'ERC-20',
    chainName: 'Robinhood',
  },

  // Remaining Robinhood Stocks & Native ETH
  {
    id: 'stock-tsla',
    name: 'Robinhood Stock (TSLA)',
    symbol: 'TSLA',
    badge: 'Stock',
    type: 'ERC-20',
    chainName: 'Robinhood',
  },
  {
    id: 'stock-amzn',
    name: 'Robinhood Stock (AMZN)',
    symbol: 'AMZN',
    badge: 'Stock',
    type: 'ERC-20',
    chainName: 'Robinhood',
  },
  {
    id: 'stock-amd',
    name: 'Robinhood Stock (AMD)',
    symbol: 'AMD',
    badge: 'Stock',
    type: 'ERC-20',
    chainName: 'Robinhood',
  },
  {
    id: 'native-rh-eth',
    name: 'Robinhood Testnet ETH',
    symbol: 'ETH',
    badge: 'Testnet Gas',
    type: 'Native',
    chainName: 'Robinhood',
    isNative: true,
  },
] as const;

export const ECOSYSTEM_LINKS = {
  robinhood: 'https://faucet.testnet.chain.robinhood.com',
  monad: 'https://monad.xyz',
  base: 'https://bridge.base.org',
} as const;
