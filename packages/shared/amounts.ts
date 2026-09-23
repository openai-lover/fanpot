export const USDC_SCALE = 1_000_000n;
export const NATIVE_PER_USDC_UNIT = 1_000_000_000_000n;
export const GOAL_MAX = 100n * USDC_SCALE;
export const WALLET_CAP = 20n * USDC_SCALE;
export const MIN_CONTRIBUTION = 100_000n;

/** Canonical input only: never accept localized, exponential or floating-point amounts. */
export function parseUSDC(value: string): bigint {
  if (!/^(0|[1-9]\d{0,14})(\.\d{1,6})?$/.test(value)) throw new Error('INVALID_AMOUNT');
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole) * USDC_SCALE + BigInt(fraction.padEnd(6, '0'));
  if (units <= 0n) throw new Error('INVALID_AMOUNT');
  return units;
}
export function formatUSDC(units: bigint, exact = false): string {
  if (units < 0n) throw new Error('INVALID_AMOUNT');
  const fraction = (units % USDC_SCALE).toString().padStart(6, '0');
  return `${units / USDC_SCALE}.${exact ? fraction : fraction.slice(0, 2)}`;
}
export function contributionError(amount: bigint, goal: bigint, total: bigint, prior: bigint): string | null {
  if (goal < USDC_SCALE || goal > GOAL_MAX || total < 0n || total > goal || prior < 0n || prior > WALLET_CAP) return 'INVALID_STATE';
  const remaining = goal - total;
  if (amount <= 0n || (amount < MIN_CONTRIBUTION && amount !== remaining)) return 'INVALID_AMOUNT';
  if (amount > remaining) return 'GOAL_CAPACITY_EXCEEDED';
  if (prior + amount > WALLET_CAP) return 'WALLET_CAP_EXCEEDED';
  return null;
}
export function proportionalRefund(contribution: bigint, pool: bigint, total: bigint): bigint {
  if (total < 0n || pool < 0n || pool > total || contribution < 0n || contribution > total) throw new Error('INVALID_ACCOUNTING');
  if (total === 0n) return 0n;
  return contribution * pool / total;
}
/** ERC20 and native USDC are the same balance. Do not add them together. */
export function requiredNativeBalance(amountUnits: bigint, gasLimit: bigint, rpcMaxFee: bigint, priorityFee: bigint) {
  if ([amountUnits, gasLimit, rpcMaxFee, priorityFee].some(n => n < 0n)) throw new Error('INVALID_GAS');
  const maxFeePerGas = rpcMaxFee < 20_000_000_000n ? 20_000_000_000n : rpcMaxFee;
  if (priorityFee > maxFeePerGas) throw new Error('INVALID_GAS');
  const gas = gasLimit * maxFeePerGas;
  const reserve = (gas + 4n) / 5n;
  return { maxFeePerGas, reserve, required: amountUnits * NATIVE_PER_USDC_UNIT + gas + reserve };
}
