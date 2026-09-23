import canonicalize from 'canonicalize';
import { isAddress, keccak256, stringToHex, zeroAddress } from 'viem';
import { z } from 'zod';

const address = z.string().refine(v => isAddress(v, { strict: true }) && v.toLowerCase() !== zeroAddress).transform(v => v.toLowerCase());
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/).refine(v => !/^0x0{64}$/.test(v)).transform(v => v.toLowerCase());
const units = z.string().regex(/^[1-9]\d{0,8}$/);
const label = z.string().min(1).max(80).refine(v => !/[<>\p{Cc}]/u.test(v));
export const rulesSchema = z.strictObject({
  version: z.literal(1), chainId: z.union([z.literal(5042), z.literal(5042002)]),
  factory: address, organizer: address, reviewer: address, usdc: address,
  goalUnits: units, deadline: z.number().int().safe().positive(), settleBy: z.number().int().safe().positive(),
  refundPolicy: z.literal('claim_on_failure'), surplusPolicy: z.literal('proportional_refund'),
  allocations: z.array(z.strictObject({ index: z.number().int().min(0).max(2), recipient: address, capUnits: units, purposeHash: hash, label })).min(1).max(3)
}).superRefine((r, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (r.organizer === r.reviewer) fail('Roles must differ');
  if (r.usdc !== '0x3600000000000000000000000000000000000000') fail('Wrong USDC');
  if (BigInt(r.goalUnits) < 1_000_000n || BigInt(r.goalUnits) > 100_000_000n) fail('Goal outside MVP limits');
  if (r.settleBy !== r.deadline + 14 * 86400) fail('Invalid settlement time');
  if (r.allocations.reduce((n, a) => n + BigInt(a.capUnits), 0n) > BigInt(r.goalUnits)) fail('Budget exceeds goal');
  r.allocations.forEach((a, i) => {
    if (a.index !== i) fail('Allocation order invalid');
    if ([r.organizer, r.reviewer].includes(a.recipient)) fail('Recipient role conflict');
  });
});
export type Rules = z.infer<typeof rulesSchema>;
export function snapshotRules(input: unknown) {
  const rules = rulesSchema.parse(input);
  const json = canonicalize(rules);
  if (!json) throw new Error('CANONICALIZATION_FAILED');
  return { rules, json, hash: keccak256(stringToHex(json)) };
}
export function validateCreationTime(rules: Rules, nowSeconds: number) {
  if (rules.deadline <= nowSeconds || rules.deadline > nowSeconds + 30 * 86400) throw new Error('INVALID_DEADLINE');
}
