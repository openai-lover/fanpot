/** Only an unknown-chain error warrants asking the wallet to add a network. */
export function isUnknownChainError(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    if ('code' in current && Number(current.code) === 4902) return true;
    current = 'cause' in current ? current.cause : null;
  }
  return false;
}
