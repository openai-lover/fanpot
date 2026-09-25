'use client';

import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseAbi, parseUnits, keccak256, toBytes, type EIP1193Provider } from 'viem';
import { WALLET_ACTIONS_PAUSED, WALLET_REVIEW_URL } from '../wallet-safety';

const chain = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } } } as const;
const usdc = '0x3600000000000000000000000000000000000000';
const tokenAbi = parseAbi(['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 value) returns (bool)', 'function balanceOf(address owner) view returns (uint256)']);
const campaignAbi = parseAbi(['function contribute(uint256 amount, bytes32 clientRef)']);
const publicClient = createPublicClient({ chain, transport: http() });

export function SupportAction({ address, active, remaining }: { address: `0x${string}`, active: boolean, remaining: bigint }) {
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function contribute() {
    if (WALLET_ACTIONS_PAUSED) { setMessage('Wallet actions are paused while the MetaMask warning is reviewed.'); return; }
    const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    if (!provider) { setMessage('Please open this page in a browser with MetaMask.'); return; }
    setBusy(true); setMessage('Connecting wallet…');
    try {
      const units = parseUnits(amount, 6);
      if (units <= 0n || units > remaining || (units < 100_000n && units !== remaining)) throw Error('Enter 0.1 USDC or more, up to the remaining goal.');
      const wallet = createWalletClient({ chain, transport: custom(provider) });
      const [account] = await wallet.requestAddresses();
      try { await wallet.switchChain({ id: chain.id }); }
      catch { await wallet.addChain({ chain }); await wallet.switchChain({ id: chain.id }); }
      const balance = await publicClient.readContract({ address: usdc, abi: tokenAbi, functionName: 'balanceOf', args: [account] });
      if (balance < units) throw Error('This wallet needs Arc Testnet USDC.');
      const allowance = await publicClient.readContract({ address: usdc, abi: tokenAbi, functionName: 'allowance', args: [account, address] });
      if (allowance < units) {
        setMessage('Approve testnet USDC in MetaMask…');
        const approval = await wallet.writeContract({ account, address: usdc, abi: tokenAbi, functionName: 'approve', args: [address, units] });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: approval });
        if (receipt.status !== 'success') throw Error('Approval did not succeed.');
      }
      setMessage('Confirm testnet contribution in MetaMask…');
      const reference = keccak256(toBytes(`fanpot:${address}:${account}:${Date.now()}:${crypto.randomUUID()}`));
      const hash = await wallet.writeContract({ account, address, abi: campaignAbi, functionName: 'contribute', args: [units, reference] });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Contribution did not succeed.');
      setMessage(`Confirmed: ${hash.slice(0, 12)}… Refresh to see the new total.`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Wallet transaction failed.'); }
    finally { setBusy(false); }
  }
  if (!active) return null;
  if (WALLET_ACTIONS_PAUSED) return <div className="arc-support"><p>Wallet actions are paused while MetaMask reviews a warning for this domain. <a href={WALLET_REVIEW_URL} target="_blank" rel="noreferrer">Review status ↗</a></p></div>;
  return <div className="arc-support"><label htmlFor="support-amount">Testnet USDC amount</label><div><input id="support-amount" type="number" min="0.1" max={String(Number(remaining) / 1_000_000)} step="0.1" value={amount} onChange={(event) => setAmount(event.target.value)} /><button className="button" disabled={busy} onClick={contribute}>{busy ? 'Working…' : 'Connect & support'}</button></div><p aria-live="polite">{message}</p></div>;
}
