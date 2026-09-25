# Arc Microgrants readiness — 2026-09-25

Official program: [Arc Microgrants](https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq). Twenty 500 USDC awards are available. It asks for a working **Arc mainnet** deployment with an openable live link, a **public** repo, a short Arc use-case description, and a public builder profile. Testnet-only builds and design mockups are explicitly ineligible. Applications close 2026-10-14 at 23:59 ET and are reviewed as they arrive. Selection looks at Arc relevance, technical credibility, build quality, and promise; no outcome can be guaranteed.

## What a reviewer can inspect now

- Four labelled Arc Testnet stories cover live funding, full funding and payout, an optional allocation skipped with unused budget refunded, and cancellation with full refunds.
- Contracts fix recipients and caps, use USDC, separate organizer and reviewer roles, and let supporters claim refunds. [Public transaction manifest](../apps/web/data/arc-testnet-demo.json) and [scenario guide](arc-testnet-demo.md) provide contract addresses and receipts.
- Generated campaign images clarify what a fan would support. They are labelled as concepts; all contributions and vendor wallets are simulated and controlled by this project.

## Eligibility blockers

1. Contracts and interactive demo exist on **Arc Testnet** only. The program requires **Arc mainnet** at submission.
2. `openai-lover/fanpot` is currently **private**. The program requires a **public repo**.
3. The working website is currently on `127.0.0.1`, without a public HTTPS link a reviewer can open.
4. The present `/arc-demo` UI is a controlled simulation, not evidence of real fandom demand, advertising placement, or merchandise delivery. Do not describe it as traction.

## Minimum path to an eligible submission

1. Review the contracts and permissions, then deploy a small mainnet campaign with a separately controlled reviewer and a real USDC test flow. Verify source and all transaction receipts. Keep real spend tightly capped.
2. Publish the app to a stable HTTPS URL and make the mainnet campaign view usable there. Show project purpose, fixed budget, live on-chain totals, proof of payout/refund, and the contract address.
3. Check the repository for secrets and private material before changing its visibility to public. Merge only reviewed changes.
4. Provide one concise project link and public builder profile in the submission. Describe FanPot as a fan campaign USDC escrow and refund prototype, not as an operating charity or evidence of genuine fan purchases.

The extra testnet cases increase technical credibility and explain the user journey. They do not replace these eligibility gates.
