import { keccak256, toBytes } from 'viem';

export const MAINNET_ORGANIZER = '0x844DFA170aDC069755eBF58FcccDC1e465cF88A5' as const;
export const MAINNET_REVIEWER = '0xD25a47E35bF60C9AA51E1F450f3E0e850721Fe78' as const;
export const MAINNET_VENDOR = '0xbb431b640e57c1134af69c8014227daab8405f90' as const;
export const MAINNET_RULES = 'FanPot Arc Mainnet proof of concept v1. Fictional LUMI birthday screen. Goal 2 USDC. One simulated vendor allocation capped at 1 USDC. Remaining funds are claimable by supporters after settlement. No advertisement is booked or delivered.';
export const MAINNET_PURPOSE = 'Fictional LUMI birthday screen: simulated vendor payout; no advertisement booked';
export const MAINNET_RULES_HASH = keccak256(toBytes(MAINNET_RULES));
export const MAINNET_PURPOSE_HASH = keccak256(toBytes(MAINNET_PURPOSE));
export const MAINNET_DRAFT_REF = keccak256(toBytes('fanpot:arc-mainnet:lumi-birthday-screen:v1'));
