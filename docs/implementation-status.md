# Implementation status / next handoff

2026-09-21: completed the first local implementation milestone requested by the user. The full implementation handoff remains the acceptance standard. This is not a completed MVP.

2026-09-25: added four explicitly fictional Arc Testnet campaigns, an on-chain readout, and a MetaMask contribution path for one funding campaign. The scenarios cover live funding, settled spending, skipped budget, cancellation, and refunds. Details and transaction links: [Arc Testnet demo](arc-testnet-demo.md). This is still not a completed MVP or Mainnet proof.

2026-09-25: added a [Mainnet wallet launch and proof flow](mainnet-connection.md), English-only site UI, a public repository, and a public Vercel site. The Mainnet factory deployment receipt and configuration are verified. MetaMask flags the site as unsafe, so wallet actions are paused during official review. Campaign creation, activation, contribution, and grant submission remain pending. See [grant readiness](grant-readiness.md).

| Handoff area | State |
|---|---|
| §5–6 and §15.5–6 campaign/factory core | Implemented and exercised on Foundry local EVM |
| §15.13 integer amount checks | Shared parser and contribution limit checks implemented |
| §15.7 canonical rules hash | Pure schema and hashing implemented; DB prepared transaction and chain binding pending |
| §8 public projection | Pure helper implemented and tested; API/DB/RLS/cache boundary pending |
| §15.9 gas and receipt | Pure gas guard and contribution log validation implemented; wallet state machine pending |
| §4/7 UI | Responsive English-only public site with fictional solo and group visuals, Arc Testnet live totals, and a Mainnet launch flow |
| §15.4 SQL / auth / indexing / APIs | Pending; health endpoint only |
| Uploads / sanitized evidence | Pending |
| Create / support / thanks / manage flows | Testnet contribution and small Mainnet wallet demonstration flows; full authenticated flows pending |
| Deployment scripts / Arc Foundry / source verification | Reproducible solc-js testnet deployment script and transaction manifest; explorer source verification pending |
| §15.16 local chain browser E2E | Pending; current Playwright suite tests the preview only |
| Actual desktop/mobile wallet and Testnet | Testnet contract flows performed with local demo wallets; MetaMask and mobile interaction still unverified |
| Mainnet / public URL / proof / grant submission | Public URL and repository live; factory deployed and verified; campaign proof and submission pending |

Next concrete milestone: SQL schema/RLS and authenticated metadata lifecycle, then shared idempotent index ingestion. Preserve prepared snapshots and public/private output separation from the start. Keep code-only progress possible before user accounts are needed. Request Supabase development credentials only when connecting to a real development DB, and WalletConnect project ID only when enabling that connector.

Git origin is `https://github.com/openai-lover/fanpot.git`. The 2026-09-25 testnet transactions used new faucet-funded demo wallets. The repository is public. One Mainnet factory deployment transaction has been verified; no campaign transaction or grant submission has been performed.
