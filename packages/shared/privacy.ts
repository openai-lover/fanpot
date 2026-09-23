import { z } from 'zod';
const nickname = z.string().refine(v => Array.from(v).length >= 1 && Array.from(v).length <= 30 && !/[<>\p{Cc}]/u.test(v));
export const preferenceSchema = z.discriminatedUnion('displayKind', [
  z.strictObject({ displayKind: z.literal('anonymous'), displayName: z.null(), amountPublic: z.boolean() }),
  z.strictObject({ displayKind: z.literal('nickname'), displayName: nickname, amountPublic: z.boolean() }),
  z.strictObject({ displayKind: z.literal('x_handle'), displayName: z.string().transform(v => v.replace(/^@/, '')).pipe(z.string().regex(/^[A-Za-z0-9_]{1,15}$/)), amountPublic: z.boolean() })
]);
export type Preference = z.infer<typeof preferenceSchema>;
export function publicSupporter(row: {
  publicRowId: string; preference: Preference; contributionUnits: bigint;
}) {
  // Explicit projection. No wallet, tx, clientRef, ordinal or timestamp join key.
  return {
    publicRowId: row.publicRowId,
    displayName: row.preference.displayKind === 'anonymous' ? 'Anonymous' : row.preference.displayKind === 'x_handle' ? `@${row.preference.displayName}` : row.preference.displayName,
    amount: row.preference.amountPublic ? row.contributionUnits.toString() : null,
    avatarSeed: row.publicRowId
  };
}
