import { createThirdwebClient } from 'thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { darkTheme } from 'thirdweb/react';

/**
 * Thirdweb Client configuration (v5 SDK)
 * Uses VITE_THIRDWEB_CLIENT_ID or fallback testing client ID
 */
export const thirdwebClient = createThirdwebClient({
  clientId:
    (import.meta as any).env?.VITE_THIRDWEB_CLIENT_ID ||
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
});

/**
 * In-App Wallets (Email, Google, Apple) + MetaMask
 */
export const thirdwebWallets = [
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple'],
    },
  }),
  createWallet('io.metamask'),
];

/**
 * Strict Minimal Dark Theme overriding Thirdweb defaults
 */
export const thirdwebTheme = darkTheme({
  colors: {
    modalBg: '#0A0A0A',
    primaryText: '#FFFFFF',
    secondaryText: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    accentText: '#FFFFFF',
  },
});
