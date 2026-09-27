import { getAddress, type EIP1193Provider } from 'viem';

/** Account access only: never switch networks, sign, approve, or send a transaction. */
export async function connectForInspection(provider: EIP1193Provider) {
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts[0]) throw Error('No wallet account selected.');
  const chainId = Number(await provider.request({ method: 'eth_chainId' }));
  return { account: getAddress(accounts[0]), chainId };
}
