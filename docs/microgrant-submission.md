# Arc Microgrants submission draft — not ready to send

The public Arc Mainnet factory is deployed and passes `pnpm verify:factory`. A campaign, separate reviewer activation, and an actual contribution are still missing. MetaMask marks the public domain unsafe, so wallet actions are paused while the cause is investigated. The text below describes the intended final submission and must be checked against deployed evidence before use.

**Project:** FanPot

**Live app:** https://fanpot-web-one.vercel.app/mainnet

**Source:** https://github.com/openai-lover/fanpot

**Builder:** https://github.com/openai-lover

## Short description

FanPot is a fan campaign escrow proof of concept on Arc Mainnet. A campaign accepts USDC toward a fixed goal. Its organizer commits recipient addresses, payout caps, a deadline, and a rules hash before funding. A separately controlled reviewer must approve a payout request that matches the committed amount and evidence hash. Supporters can claim eligible refunds when funding fails or after settlement; the organizer has no withdrawal or rule change function for an existing campaign.

Arc makes the transaction currency and gas currency USDC, so the demo can show campaign accounting and receipts in one familiar unit. The live page reads contract state directly from Arc rather than displaying an editable fundraising total. The public repository includes the contracts, wallet flow, generated demo imagery, transaction manifest, and a proof verifier that checks deployed bytecode input, roles, campaign configuration, receipts, and a real contribution.

## Reviewer path

1. Open the live Mainnet page and inspect the campaign contract address, current phase, onchain contribution total, fixed recipient cap, and links to the Arc explorer.
2. Read the fixed rules and the separate organizer/reviewer addresses. Follow the transaction links for deployment, campaign creation, activation, and contribution.
3. Inspect the source and run `pnpm verify:proof` to check the recorded transactions against Arc Mainnet.
4. The separate `/arc-demo` page illustrates refund and spending edge cases on Arc Testnet; it is supporting context and is not the Mainnet proof.

The named artist, campaign, fans, and vendor are simulated for this proof of concept. The concept images are AI generated. No real advertisement was booked, goods were manufactured, or independent fans contributed. The recorded factory deployment paid real Arc Mainnet USDC gas; the planned campaign contribution has not happened. The contracts have not undergone a third-party audit.

**Submission gate:** Submit only after MetaMask's domain warning is resolved, a Mainnet campaign is active, a real contribution is visible, `pnpm verify:proof` passes, and the public page shows the corresponding contract evidence.
