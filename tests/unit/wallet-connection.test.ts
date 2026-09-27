import { describe, expect, it, vi } from 'vitest';
import type { EIP1193Provider } from 'viem';
import { connectForInspection } from '../../apps/web/wallet-connection';

describe('account-only wallet inspection', () => {
  it('requests account access and reads the network without a signing or network-change request', async () => {
    const request = vi.fn().mockResolvedValueOnce(['0x844DFA170aDC069755eBF58FcccDC1e465cF88A5']).mockResolvedValueOnce('0x13b2');
    await expect(connectForInspection({ request } as unknown as EIP1193Provider)).resolves.toEqual({ account: '0x844DFA170aDC069755eBF58FcccDC1e465cF88A5', chainId: 5042 });
    expect(request.mock.calls).toEqual([[{ method: 'eth_requestAccounts' }], [{ method: 'eth_chainId' }]]);
  });
  it('stops immediately when the connection prompt is rejected', async () => {
    const rejection = Object.assign(new Error('User rejected the request.'), { code: 4001 });
    const request = vi.fn().mockRejectedValue(rejection);
    await expect(connectForInspection({ request } as unknown as EIP1193Provider)).rejects.toBe(rejection);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
