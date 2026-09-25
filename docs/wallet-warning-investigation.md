# MetaMask website warning investigation — 2026-09-25

## What is known

MetaMask displayed **Malicious / unsafe** for `fanpot-web-one.vercel.app` at the account connection prompt. The first wallet call in each FanPot entry point is Viem `requestAddresses()` (an `eth_requestAccounts` request). Arc network switching and all contract transactions happen afterward. The prompt's general permissions to view balances and *request* transactions are normal dapp connection capabilities; a transaction or USDC allowance still requires a separate confirmation. See MetaMask's [dapp guide](https://support.metamask.io/more-web3/dapps/user-guide-dapps/) and [security alerts guide](https://support.metamask.io/configure/wallet/security-alerts/).

The production URL returns HTTPS 200 with HSTS, `nosniff`, frame denial, and a referrer policy. A code search found no seed-phrase form, injected remote script, hidden wallet request, `eval`, or automatic approval. Mainnet uses Arc chain ID `5042`, its official RPC, and the official USDC system contract. The deployed factory's creation input, runtime code, owner, reviewer, and USDC configuration pass `pnpm verify:factory`. These checks do not establish why MetaMask classified the site or constitute a security audit.

The exact hostname is absent from the public [`eth-phishing-detect` configuration](https://github.com/MetaMask/eth-phishing-detect/blob/main/src/config.json) checked on this date. MetaMask's [security alerts guide](https://support.metamask.io/configure/wallet/security-alerts/) explains that other threat intelligence and partners can contribute to its site classification. Absence from this one list is therefore inconclusive.

## Similar public reports

- [QbitMarket issue #246887](https://github.com/MetaMask/eth-phishing-detect/issues/246887) describes a malicious-site warning *at wallet connection*, before a transaction, on one production domain while an equivalent Vercel preview did not warn. This is a reporter's account, not a confirmed diagnosis of FanPot.
- [NovaDEX issue #274251](https://github.com/MetaMask/eth-phishing-detect/issues/274251) concerns an Arc Testnet app on a `vercel.app` hostname. Its issue was labelled **other list blocked**, meaning the domain was not on that repository's blocklist. This shows that checking only that list can miss the warning source.
- [ARC Identity issue #246521](https://github.com/MetaMask/eth-phishing-detect/issues/246521) likewise records an Arc app and a prior Vercel URL with an **other list blocked** label. It does not prove that Vercel hosting itself causes the classification.

## Code change and current decision

All wallet entry points remain paused while the site's warning is unresolved. The previously opened public review issue was closed at the builder's request; no review is pending. UI and documentation no longer link to it.

Network switching now asks MetaMask to add Arc only when the existing network is genuinely unknown (error `4902`). A rejected switch or another error is propagated instead of causing an unrelated add-network prompt. This improves connection behavior but cannot remove a warning that appears earlier at `requestAddresses()`.

Do not infer a false positive from these checks or submit a Mainnet transaction through a wallet showing the malicious-site warning. The missing Mainnet campaign, reviewer activation, contribution, and public proof remain grant submission gates.
