'use client';

import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseAbi, type EIP1193Provider } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { WALLET_ACTIONS_PAUSED } from '../wallet-safety';
import { isUnknownChainError } from '../wallet-network';

const client = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0], { timeout: 8000 }) });
const usdcAbi = parseAbi(['function balanceOf(address owner) view returns (uint256)']);

export function MainnetWallet() {
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function connect() {
    if (WALLET_ACTIONS_PAUSED) { setMessage('Wallet actions are paused while the MetaMask warning is unresolved.'); return; }
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
        if (!isUnknownChainError(error)) throw error;
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
    <p>{WALLET_ACTIONS_PAUSED ? 'MetaMask currently marks this domain as unsafe. The cause is still unknown; wallet actions remain paused.' : 'Connect MetaMask to read your Arc Mainnet USDC balance.'}</p>
    <button className="button" type="button" onClick={connect} disabled={busy || WALLET_ACTIONS_PAUSED}>{busy ? 'Connecting…' : address ? 'Refresh wallet balance' : 'Connect wallet'}</button>
    {address && <dl><div><dt>Address</dt><dd>{address.slice(0, 6)}…{address.slice(-4)}</dd></div><div><dt>Mainnet USDC</dt><dd>{balance} USDC</dd></div></dl>}
    <p className="mainnet-wallet-message" aria-live="polite">{message}</p>
  </section>;
}
