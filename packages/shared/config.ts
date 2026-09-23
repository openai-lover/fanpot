import { isAddress, zeroAddress } from 'viem';
import { ARC_USDC } from './chain.ts';
const required = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_CHAIN_ID', 'NEXT_PUBLIC_ARC_RPC_URL', 'NEXT_PUBLIC_ARC_EXPLORER_URL', 'NEXT_PUBLIC_USDC_ADDRESS', 'NEXT_PUBLIC_FACTORY_ADDRESS', 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'ARC_RPC_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL', 'CRON_SECRET', 'RATE_LIMIT_HMAC_SECRET', 'APP_ORIGIN', 'FACTORY_DEPLOYMENT_BLOCK', 'REVIEWER_ADDRESS', 'PUBLISHER_ADDRESS'] as const;
export function validateProductionConfig(env: Record<string, string | undefined>) {
  const problems: string[] = [];
  for (const name of required) if (!env[name] || /<|ACTUAL_|placeholder/i.test(env[name]!)) problems.push(`${name}: missing real value`);
  if (env.NEXT_PUBLIC_CHAIN_ID !== '5042') problems.push('Production must use chain 5042');
  if (env.NEXT_PUBLIC_USDC_ADDRESS?.toLowerCase() !== ARC_USDC.toLowerCase()) problems.push('Unexpected USDC address');
  if (env.NEXT_PUBLIC_ARC_EXPLORER_URL !== 'https://explorer.arc.io') problems.push('Unexpected explorer');
  for (const key of ['NEXT_PUBLIC_FACTORY_ADDRESS', 'REVIEWER_ADDRESS', 'PUBLISHER_ADDRESS']) {
    const value = env[key] ?? '';
    if (!isAddress(value) || value.toLowerCase() === zeroAddress) problems.push(`${key}: invalid address`);
  }
  for (const key of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_ARC_RPC_URL', 'ARC_RPC_URL', 'SUPABASE_URL', 'APP_ORIGIN']) {
    try { const u = new URL(env[key] ?? ''); if (u.protocol !== 'https:' || u.username || u.password) throw Error(); } catch { problems.push(`${key}: valid HTTPS URL required`); }
  }
  if (env.NEXT_PUBLIC_APP_URL !== env.APP_ORIGIN) problems.push('App URL and SIWE origin must match');
  if (!/^\d+$/.test(env.FACTORY_DEPLOYMENT_BLOCK ?? '')) problems.push('Invalid deployment block');
  for (const key of ['CRON_SECRET', 'RATE_LIMIT_HMAC_SECRET']) if ((env[key]?.length ?? 0) < 32) problems.push(`${key}: minimum 32 characters`);
  if (env.CRON_SECRET && env.CRON_SECRET === env.RATE_LIMIT_HMAC_SECRET) problems.push('Secrets must differ');
  for (const key of Object.keys(env)) if (key.startsWith('NEXT_PUBLIC_') && /SECRET|PRIVATE|SERVICE_ROLE|MNEMONIC|KEYSTORE/.test(key)) problems.push(`${key}: secret must not be public`);
  return problems;
}
