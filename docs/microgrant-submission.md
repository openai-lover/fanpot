# Arc Microgrants submission draft — Mainnet proof verified

**Current judge-facing copy (September 28):** [Concise title, visual summary, market sources and formatted application](submission/README.md). The technical reference below is retained for proof verification.

The complete funding-to-refund lifecycle has been executed on Arc Mainnet. Funding, organizer payout request, reviewer-approved payment, settlement and supporter refund are confirmed. The campaign is Closed with zero accounted balance. [Verify every step and receipt](submission/mainnet-proof.md). The application has not been submitted.

**Project:** FanPot

**Live app:** https://fanpot-web-one.vercel.app/mainnet

**Source:** https://github.com/openai-lover/fanpot

**Builder:** https://github.com/openai-lover

## Short description

FanPot is a fan campaign escrow proof of concept on Arc Mainnet. A campaign accepts USDC toward a fixed goal. Its organizer commits recipient addresses, payout caps, a deadline, and a rules hash before funding. A separate reviewer wallet must approve a payout request that matches the committed amount and evidence hash. Supporters can claim eligible refunds when funding fails or after settlement; the organizer has no withdrawal or rule change function for an existing campaign.

Arc makes the transaction currency and gas currency USDC, so the demo can show campaign accounting and receipts in one familiar unit. The live page reads contract state directly from Arc rather than displaying an editable fundraising total. The public repository includes the contracts, wallet flow, generated demo imagery, transaction manifest, and a proof verifier that checks deployed bytecode input, roles, campaign configuration, receipts, and the complete payment/refund lifecycle.

## Reviewer path

1. Open the live Mainnet page and inspect the campaign contract address, current phase, onchain contribution total, fixed recipient cap, and links to the Arc explorer.
2. Read the fixed rules and the separate organizer/reviewer addresses. Follow the transaction links for deployment, campaign creation, activation, funding, payout request, reviewer-approved payment, settlement, and refund.
3. Inspect the source and run `pnpm verify:proof` to check the recorded transactions against Arc Mainnet.
4. The separate `/arc-demo` page illustrates refund and spending edge cases on Arc Testnet; it is supporting context and is not the Mainnet proof.

The named artist, campaign, fans, and vendor are simulated for this proof of concept. The concept images are AI generated. No real advertisement was booked, goods were manufactured, or independent fans contributed. All demonstration wallets are controlled by the builder. The recorded transactions used real Arc Mainnet USDC for gas, and 2 USDC was contributed to the campaign: 1 USDC was paid to the fixed recipient and 1 USDC refunded to the supporter. Network fees are separate. The contracts have not undergone a third-party audit.

**Before submitting:** Confirm the builder’s program eligibility and declaration answers, then submit the live link, public repository, builder profile, and description through the official application. The full Mainnet lifecycle and its receipt verification are complete. The fresh MetaMask check did not reproduce the domain warning; its original classification cause remains unknown.
