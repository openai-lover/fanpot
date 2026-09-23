import { defineChain } from 'viem';
export const ARC_USDC = '0x3600000000000000000000000000000000000000' as const;
export const fanpotArc = defineChain({ id: 5042, name: 'Arc', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } }, blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } }, testnet: false });
export const fanpotArcTestnet = defineChain({ id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } }, blockExplorers: { default: { name: 'Arc Testnet Explorer', url: 'https://explorer.testnet.arc.io' } }, testnet: true });
