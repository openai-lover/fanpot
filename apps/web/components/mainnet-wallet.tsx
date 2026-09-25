'use client';

import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseAbi, type EIP1193Provider } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';

const client = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0], { timeout: 8000 }) });
const usdcAbi = parseAbi(['function balanceOf(address owner) view returns (uint256)']);

function isUnknownChain(error: unknown) {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    if ('code' in current && Number(current.code) === 4902) return true;
    current = 'cause' in current ? current.cause : null;
  }
  return false;
}

export function MainnetWallet() {
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function connect() {
    const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    if (!provider) { setMessage('Open this page in a browser with MetaMask.'); return; }
    setBusy(true);
    setMessage('Connecting wallet…');
    try {
      const wallet = createWalletClient({ chain: fanpotArc, transport: custom(provider) });
      const [selected] = await wallet.requestAddresses();
      if (!selected) throw Error('No wallet account selected.');
      try {
        await wallet.switchChain({ id: fanpotArc.id });
      } catch (error) {
        if (!isUnknownChain(error)) throw error;
        await wallet.addChain({ chain: fanpotArc });
        await wallet.switchChain({ id: fanpotArc.id });
      }
      if (await wallet.getChainId() !== fanpotArc.id) throw Error('Wallet is not on Arc Mainnet.');
      const units = await client.readContract({ address: ARC_USDC, abi: usdcAbi, functionName: 'balanceOf', args: [selected] });
      setAddress(selected);
      setBalance(formatUnits(units, 6));
      setMessage('Read-only connection complete.');
    } catch (error) {
      setAddress(null);
      setBalance(null);
      setMessage(error instanceof Error ? error.message : 'Wallet connection failed.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="mainnet-panel" aria-labelledby="wallet-status-heading">
    <h2 id="wallet-status-heading">Your wallet</h2>
    <p>Connect MetaMask to read your Arc Mainnet USDC balance.</p>
    <button className="button" type="button" onClick={connect} disabled={busy}>{busy ? 'Connecting…' : address ? 'Refresh wallet balance' : 'Connect wallet'}</button>
    {address && <dl><div><dt>Address</dt><dd>{address.slice(0, 6)}…{address.slice(-4)}</dd></div><div><dt>Mainnet USDC</dt><dd>{balance} USDC</dd></div></dl>}
    <p className="mainnet-wallet-message" aria-live="polite">{message}</p>
  </section>;
}
