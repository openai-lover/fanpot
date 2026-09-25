'use client';

import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, formatUnits, getAddress, http, keccak256, parseAbi, parseUnits, toBytes, type EIP1193Provider } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { fanPotCampaignAbi } from '@fanpot/shared/abi/FanPotCampaign';
import { WALLET_ACTIONS_PAUSED, WALLET_REVIEW_URL } from '../wallet-safety';

const campaignClient = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0]) });
const tokenAbi = parseAbi(['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)', 'function balanceOf(address owner) view returns (uint256)']);

export function MainnetSupport({ campaign, phase, remaining, deadline, settleBy }: { campaign: `0x${string}`; phase: number; remaining: string; deadline: number; settleBy: number }) {
  const [amount, setAmount] = useState('0.25');
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [contributed, setContributed] = useState<string | null>(null);
  const [claimable, setClaimable] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function connect() {
    if (WALLET_ACTIONS_PAUSED) throw Error('Wallet actions are paused while the MetaMask warning is reviewed.');
    const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    if (!provider) throw Error('Open this page in a browser with MetaMask.');
    const wallet = createWalletClient({ chain: fanpotArc, transport: custom(provider) });
    const [account] = await wallet.requestAddresses();
    if (!account) throw Error('Select a wallet account.');
    if (await wallet.getChainId() !== fanpotArc.id) {
      try { await wallet.switchChain({ id: fanpotArc.id }); }
      catch { await wallet.addChain({ chain: fanpotArc }); await wallet.switchChain({ id: fanpotArc.id }); }
    }
    if (await wallet.getChainId() !== fanpotArc.id) throw Error('Switch your wallet to Arc Mainnet.');
    return { wallet, account: getAddress(account) };
  }
  async function refresh() {
    setBusy(true); setMessage('Reading your onchain position…');
    try {
      const { account } = await connect();
      const [units, given, available] = await Promise.all([
        campaignClient.readContract({ address: ARC_USDC, abi: tokenAbi, functionName: 'balanceOf', args: [account] }),
        campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'contributions', args: [account] }),
        campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'claimable', args: [account] }),
      ]);
      setWalletAddress(account); setBalance(formatUnits(units, 6)); setContributed(formatUnits(given, 6)); setClaimable(formatUnits(available, 6));
      setMessage('Onchain position refreshed.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Wallet connection failed.'); }
    finally { setBusy(false); }
  }
  async function support() {
    setBusy(true); setMessage('Checking campaign and wallet…');
    try {
      const units = parseUnits(amount, 6);
      const left = parseUnits(remaining, 6);
      if (phase !== 1) throw Error('Funding is not active.');
      if (units <= 0n || units > left || (units < 100_000n && units !== left)) throw Error('Enter at least 0.1 USDC, no more than the remaining goal.');
      const { wallet, account } = await connect();
      const [actualPhase, deadline, given, balance, allowance] = await Promise.all([
        campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'phase' }),
        campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'deadline' }),
        campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'contributions', args: [account] }),
        campaignClient.readContract({ address: ARC_USDC, abi: tokenAbi, functionName: 'balanceOf', args: [account] }),
        campaignClient.readContract({ address: ARC_USDC, abi: tokenAbi, functionName: 'allowance', args: [account, campaign] }),
      ]);
      if (actualPhase !== 1 || Number(deadline) <= Date.now() / 1000) throw Error('Funding has closed. Refresh the page.');
      if (given + units > parseUnits('20', 6)) throw Error('The campaign limit is 20 USDC per wallet.');
      if (balance < units) throw Error('Your Arc Mainnet USDC balance is too low. Allow some USDC for gas.');
      if (allowance < units) {
        setMessage(`Confirm an exact ${amount} USDC allowance in MetaMask…`);
        const approval = await wallet.writeContract({ account, chain: fanpotArc, address: ARC_USDC, abi: tokenAbi, functionName: 'approve', args: [campaign, units] });
        const receipt = await campaignClient.waitForTransactionReceipt({ hash: approval });
        if (receipt.status !== 'success') throw Error('USDC approval failed.');
      }
      setMessage(`Confirm the ${amount} USDC contribution in MetaMask…`);
      const reference = keccak256(toBytes(`fanpot-mainnet:${campaign}:${account}:${crypto.randomUUID()}`));
      const hash = await wallet.writeContract({ account, chain: fanpotArc, address: campaign, abi: fanPotCampaignAbi, functionName: 'contribute', args: [units, reference] });
      const receipt = await campaignClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Contribution failed.');
      setMessage(`Confirmed: ${hash}. Refreshing live totals…`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Contribution failed.'); }
    finally { setBusy(false); }
  }
  async function refund() {
    setBusy(true); setMessage('Checking claimable refund…');
    try {
      const { wallet, account } = await connect();
      const available = await campaignClient.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'claimable', args: [account] });
      if (available <= 0n) throw Error('No claimable refund for this wallet.');
      setMessage(`Confirm refund claim of ${formatUnits(available, 6)} USDC in MetaMask…`);
      const hash = await wallet.writeContract({ account, chain: fanpotArc, address: campaign, abi: fanPotCampaignAbi, functionName: 'claimRefund' });
      const receipt = await campaignClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Refund claim failed.');
      setMessage(`Refund confirmed: ${hash}`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Refund claim failed.'); }
    finally { setBusy(false); }
  }
  async function finish(functionName: 'finalize' | 'settle') {
    setBusy(true); setMessage('Checking deadline and campaign state…');
    try {
      const now = Math.floor(Date.now() / 1000);
      if (functionName === 'finalize' && now < deadline) throw Error('Funding deadline has not passed.');
      if (functionName === 'settle' && now < settleBy) throw Error('The settlement timeout has not passed. Budget resolution can settle sooner.');
      const { wallet, account } = await connect();
      const hash = await wallet.writeContract({ account, chain: fanpotArc, address: campaign, abi: fanPotCampaignAbi, functionName });
      const receipt = await campaignClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Settlement transaction failed.');
      setMessage(`Confirmed: ${hash}`); window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Settlement failed.'); }
    finally { setBusy(false); }
  }
  if (WALLET_ACTIONS_PAUSED) return <section className="mainnet-panel mainnet-action"><h2>Wallet actions paused</h2><p>MetaMask currently marks this domain as unsafe. Do not connect or sign while its classification is reviewed. <a href={WALLET_REVIEW_URL} target="_blank" rel="noreferrer">Review status ↗</a></p></section>;
  return <section className="mainnet-panel mainnet-action"><h2>Your onchain position</h2><p>Connect MetaMask to see your balance, contribution and refund entitlement. Arc Mainnet transactions use real USDC, including gas.</p><button className="outline-button" type="button" disabled={busy} onClick={refresh}>{busy ? 'Working…' : walletAddress ? 'Refresh wallet' : 'Connect wallet'}</button>{walletAddress && <dl><div><dt>Wallet</dt><dd>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</dd></div><div><dt>USDC balance</dt><dd>{balance} USDC</dd></div><div><dt>Contributed</dt><dd>{contributed} USDC</dd></div><div><dt>Claimable refund</dt><dd>{claimable} USDC</dd></div></dl>}{phase === 1 && <div className="mainnet-contribute"><label htmlFor="mainnet-amount">Contribution in USDC</label><div><input id="mainnet-amount" type="number" min="0.1" max={remaining} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /><button className="button" type="button" disabled={busy} onClick={support}>Support on Mainnet</button></div><small>MetaMask may ask for one exact USDC approval, then one contribution transaction.</small></div>}{(phase === 0 || phase === 1) && <button className="outline-button" type="button" disabled={busy} onClick={() => finish('finalize')}>Finalize after funding deadline</button>}{(phase === 2 || phase === 3) && <button className="outline-button" type="button" disabled={busy} onClick={() => finish('settle')}>Settle after timeout</button>}{phase === 4 && <button className="button" type="button" disabled={busy || claimable === '0'} onClick={refund}>Claim available refund</button>}<p className="mainnet-wallet-message" aria-live="polite">{message}</p></section>;
}
