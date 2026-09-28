'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPublicClient, createWalletClient, custom, formatUnits, getAddress, http, type EIP1193Provider } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { fanPotCampaignAbi as abi } from '@fanpot/shared/abi/FanPotCampaign';
import { fanPotFactoryAbi } from '@fanpot/shared/abi/FanPotFactory';
import { MAINNET_ORGANIZER, MAINNET_REVIEWER, MAINNET_RULES_HASH, MAINNET_PURPOSE_HASH, MAINNET_VENDOR } from '@fanpot/shared/mainnet-plan';
import { MAINNET_PAYOUT_AMOUNT, MAINNET_PAYOUT_HASH, MAINNET_PAYOUT_RECORD, payoutActions } from '@fanpot/shared/mainnet-payout';
import deployment from '../data/arc-mainnet-deployment.json';
import { WALLET_ACTIONS_PAUSED } from '../wallet-safety';
import { connectForInspection } from '../wallet-connection';
import { isUnknownChainError } from '../wallet-network';

const campaign = getAddress(deployment.campaign);
const client = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0]) });
const phases = ['Awaiting activation', 'Funding', 'Goal met', 'Paying', 'Refunds open', 'Closed'];
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const fmt = (a: bigint) => formatUnits(a, 6);

async function readState() {
  const block = await client.getBlock();
  const blockNumber = block.number;
  const [chain, registered, count, config, summary, allocation] = await Promise.all([
    client.getChainId(),
    client.readContract({ address: getAddress(deployment.factory), abi: fanPotFactoryAbi, functionName: 'isCampaign', args: [campaign], blockNumber }),
    client.readContract({ address: campaign, abi, functionName: 'allocationCount', blockNumber }),
    client.readContract({ address: campaign, abi, functionName: 'getConfig', blockNumber }),
    client.readContract({ address: campaign, abi, functionName: 'getSummary', blockNumber }),
    client.readContract({ address: campaign, abi, functionName: 'getAllocation', args: [0], blockNumber }),
  ]);
  if (chain !== fanpotArc.id || !registered || count !== 1n || !same(config.organizer, MAINNET_ORGANIZER)
    || !same(config.reviewer, MAINNET_REVIEWER) || !same(config.usdc, ARC_USDC) || config.goal !== 2_000_000n
    || config.rulesHash !== MAINNET_RULES_HASH || !same(allocation.recipient, MAINNET_VENDOR)
    || allocation.cap !== MAINNET_PAYOUT_AMOUNT || allocation.purposeHash !== MAINNET_PURPOSE_HASH) {
    throw Error('Campaign configuration does not match the published rules. Payments are unavailable.');
  }
  return { config, summary, allocation, blockNumber, timestamp: block.timestamp,
    phase: summary.phase, outcome: summary.outcome, allocationStatus: allocation.status,
    organizer: config.organizer, reviewer: config.reviewer, requestedAmount: allocation.requestedAmount,
    evidenceHash: allocation.evidenceHash, settleBy: BigInt(config.settleBy),
  };
}
type Snapshot = Awaited<ReturnType<typeof readState>>;

export function MainnetPayout() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chain, setChain] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading campaign…');
  const [transaction, setTransaction] = useState<`0x${string}` | null>(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let active = true;
    readState().then(s => { if (active) { setState(s); setMessage(''); } }).catch(e => { if (active) setMessage(e instanceof Error ? e.message : 'Unable to load campaign.'); });
    const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    const changed = () => { setAccount(null); setChain(null); setReviewed(false); };
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    return () => { active = false; provider?.removeListener?.('accountsChanged', changed); provider?.removeListener?.('chainChanged', changed); };
  }, []);

  async function refresh() {
    setBusy(true);
    try { setState(await readState()); setMessage('Campaign updated from Arc Mainnet.'); }
    catch (e) { setState(null); setMessage(e instanceof Error ? e.message : 'Unable to refresh.'); }
    finally { setBusy(false); }
  }
  async function connect() {
    setBusy(true);
    try {
      if (WALLET_ACTIONS_PAUSED) throw Error('Wallet actions are paused.');
      const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
      if (!provider) throw Error('Open this page in MetaMask or a browser with MetaMask.');
      const result = await connectForInspection(provider);
      setAccount(result.account); setChain(result.chainId); setReviewed(false);
      setState(await readState()); setMessage('Wallet connected. Review the payment details before signing.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to connect.'); }
    finally { setBusy(false); }
  }

  async function transact(action: 'request' | 'approve' | 'settle') {
    if (busy || !state) return;
    setBusy(true); setMessage('Checking the latest campaign state…'); setTransaction(null);
    try {
      if (WALLET_ACTIONS_PAUSED) throw Error('Wallet actions are paused.');
      if (action === 'approve' && !reviewed) throw Error('Review the recipient, amount and payout record first.');
      const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
      if (!provider) throw Error('MetaMask is required.');
      const wallet = createWalletClient({ chain: fanpotArc, transport: custom(provider) });
      const [selected] = await wallet.requestAddresses();
      if (!selected || !account || !same(selected, account)) throw Error('Your wallet account changed. Reconnect and review the payment.');
      if (await wallet.getChainId() !== fanpotArc.id) {
        try { await wallet.switchChain({ id: fanpotArc.id }); }
        catch (e) { if (!isUnknownChainError(e)) throw e; await wallet.addChain({ chain: fanpotArc }); await wallet.switchChain({ id: fanpotArc.id }); }
      }
      if (await wallet.getChainId() !== fanpotArc.id) throw Error('Switch to Arc Mainnet.');
      const latest = await readState(); setState(latest);
      if (!payoutActions(latest, selected)[action]) throw Error('This action is unavailable for this wallet or campaign state. Review the updated details.');
      if (action === 'approve' && (state.requestedAmount !== latest.requestedAmount || state.evidenceHash !== latest.evidenceHash)) throw Error('The request changed. Refresh and review it again.');
      const base = { address: campaign, abi, account: selected, chain: fanpotArc } as const;
      // Simulate the exact transaction before opening the wallet's confirmation.
      const simulation = action === 'request'
        ? await client.simulateContract({ ...base, functionName: 'requestPayout', args: [0, MAINNET_PAYOUT_AMOUNT, MAINNET_PAYOUT_HASH] })
        : action === 'approve'
          ? await client.simulateContract({ ...base, functionName: 'approveAndPay', args: [0, latest.requestedAmount, latest.evidenceHash] })
          : await client.simulateContract({ ...base, functionName: 'settle' });
      if (await wallet.getChainId() !== fanpotArc.id || !same((await wallet.getAddresses())[0] ?? '', selected)) throw Error('Wallet changed. Reconnect before signing.');
      setMessage(action === 'approve' ? 'Review the 1 USDC payment to the fixed recipient in MetaMask.' : 'Review and sign this transaction in MetaMask.');
      const request = simulation.request;
      const hash = request.functionName === 'requestPayout'
        ? await wallet.writeContract(request)
        : request.functionName === 'approveAndPay'
          ? await wallet.writeContract(request)
          : await wallet.writeContract(request);
      setTransaction(hash);
      setMessage('Transaction submitted. Waiting for confirmation…');
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Transaction reverted. No successful action was recorded.');
      setReviewed(false); setState(await readState());
      setMessage(action === 'request' ? 'Payment requested. The reviewer can now open this page and approve it.' : action === 'approve' ? 'Payment confirmed. Settle the campaign to open remaining refunds.' : 'Settlement confirmed. Supporters can now claim eligible refunds on the campaign page.');
    } catch (e) { setReviewed(false); setMessage(e instanceof Error ? e.message : 'Transaction failed.'); }
    finally { setBusy(false); }
  }

  const actions = state ? payoutActions(state, account) : null;
  const remaining = state ? state.config.goal - state.summary.totalContributed : 0n;
  return <div className="launch-grid">
    <section className="mainnet-panel launch-wide">
      <h2>{state ? phases[state.phase] : 'Campaign status'}</h2>
      {state && <p>{fmt(state.summary.totalContributed)} / {fmt(state.config.goal)} USDC funded · {fmt(state.summary.totalPaid)} USDC paid · {fmt(state.summary.totalRefunded)} USDC refunded</p>}
      {state?.phase === 1 && <p>Funding must reach the goal before a payment can be requested. Remaining: {fmt(remaining)} USDC. <Link href="/mainnet#support">Contribute to this campaign →</Link></p>}
      <button type="button" className="outline-button" disabled={busy} onClick={refresh}>Refresh campaign</button>
      <button type="button" className="outline-button" disabled={busy || WALLET_ACTIONS_PAUSED} onClick={connect}>{account ? 'Reconnect wallet' : 'Connect wallet'}</button>
      {account && <p>Connected: {account}<br />{same(account, MAINNET_ORGANIZER) ? 'Organizer' : same(account, MAINNET_REVIEWER) ? 'Reviewer' : 'Supporter'} · {chain === fanpotArc.id ? 'Arc Mainnet' : 'The next action will request Arc Mainnet.'}</p>}
      <p className="mainnet-wallet-message" role="status">{message}</p>
      {transaction && <a href={`https://explorer.arc.io/tx/${transaction}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
    </section>
    <section className="mainnet-panel">
      <h2>1. Request payment</h2>
      <p>The organizer requests the published payment after the funding goal is met. This step does not transfer funds.</p>
      <dl><div><dt>Organizer</dt><dd>{MAINNET_ORGANIZER}</dd></div><div><dt>Amount</dt><dd>1 USDC</dd></div><div><dt>Fixed recipient</dt><dd>{MAINNET_VENDOR}</dd></div></dl>
      <p>Controlled transfer to a builder-owned wallet. No advertisement or service has been delivered.</p>
      <button type="button" className="button" disabled={busy || WALLET_ACTIONS_PAUSED || !actions?.request} onClick={() => transact('request')}>Request 1 USDC payout</button>
      {state && state.allocationStatus !== 0 && <p>{state.allocationStatus === 1 ? 'Payment request is awaiting review.' : 'This allocation is already resolved.'}</p>}
    </section>
    <section className="mainnet-panel">
      <h2>2. Review & pay</h2>
      <p>Open this same page with the reviewer wallet. Approval sends the requested USDC directly to the fixed recipient.</p>
      <dl><div><dt>Reviewer</dt><dd>{MAINNET_REVIEWER}</dd></div><div><dt>Pending amount</dt><dd>{state ? fmt(state.requestedAmount) : '—'} USDC</dd></div><div><dt>Recipient</dt><dd>{MAINNET_VENDOR}</dd></div></dl>
      <details><summary>Review the payout record</summary><p>{MAINNET_PAYOUT_RECORD}</p><p>Record hash</p><code>{MAINNET_PAYOUT_HASH}</code>{state?.allocationStatus === 1 && <><p>Onchain request hash</p><code>{state.evidenceHash}</code></>}</details>
      {state?.allocationStatus === 1 && !actions?.requestMatches && <p>The pending request does not match the published record. Approval is blocked.</p>}
      <label><input type="checkbox" checked={reviewed} disabled={busy || !actions?.approve} onChange={e => setReviewed(e.target.checked)} /> I reviewed the amount, recipient and payout record.</label>
      <button type="button" className="button" disabled={busy || WALLET_ACTIONS_PAUSED || !actions?.approve || !reviewed} onClick={() => transact('approve')}>Approve & pay 1 USDC</button>
    </section>
    <section className="mainnet-panel launch-wide">
      <h2>3. Settle & return the balance</h2>
      <p>After the allocation is resolved, settlement opens refunds for unused funds. Supporters then claim their share from the campaign page. Each action uses real USDC for network fees.</p>
      <button type="button" className="outline-button" disabled={busy || WALLET_ACTIONS_PAUSED || !actions?.settle} onClick={() => transact('settle')}>Settle campaign</button>
      {state && (state.phase === 4 || state.phase === 5) && <p>{state.phase === 4 ? 'Refunds are open.' : 'Campaign closed.'}</p>}
      <Link href="/mainnet#support">View your contribution & refund →</Link>
      <a href={`https://explorer.arc.io/address/${campaign}`} target="_blank" rel="noreferrer">Inspect the campaign contract ↗</a>
    </section>
  </div>;
}
