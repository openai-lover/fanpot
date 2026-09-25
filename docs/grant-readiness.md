# Arc Microgrants readiness — 2026-09-25

Official program: [Arc Microgrants](https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq). Twenty 500 USDC awards are available. It asks for a working **Arc mainnet** deployment with an openable live link, a **public** repo, a short Arc use-case description, and a public builder profile. Testnet-only builds and design mockups are explicitly ineligible. Applications close 2026-10-14 at 23:59 ET and are reviewed as they arrive. Selection looks at Arc relevance, technical credibility, build quality, and promise; no outcome can be guaranteed.

## Public material

- Repository: [openai-lover/fanpot](https://github.com/openai-lover/fanpot), public after a tracked-secret audit.
- HTTPS site: [FanPot](https://fanpot-web-one.vercel.app/), with `/launch` and `/mainnet` available on the production deployment.
- Arc Testnet: four clearly labelled fictional scenarios in the [transaction manifest](../apps/web/data/arc-testnet-demo.json) and [scenario guide](arc-testnet-demo.md). These demonstrate funding, payout, skipped budget, cancellation, and refunds, but are not Mainnet evidence or real fan traction.

## Mainnet proof still required

The FanPot factory was deployed on Arc Mainnet by the organizer in [transaction `0xc4ce…5892`](https://explorer.arc.io/tx/0xc4ce06ea92cfae48ee95fcba9cdaa04e5904c17881a2fed34cac85e0b2865892). Its deployed address is [`0x8D8a…77Ab6`](https://explorer.arc.io/address/0x8D8a8bEdE436bfF36E70d261E2041dA6F6777Ab6). The receipt succeeded, creation input matches the checked-in bytecode and constructor arguments, and onchain owner, reviewer, and USDC match the plan. The [Mainnet manifest](../apps/web/data/arc-mainnet-deployment.json) records this evidence. No Mainnet campaign has been created or contributed to yet. `pnpm verify:proof` intentionally fails until it verifies organizer allowlisting, campaign creation, reviewer activation, and a real USDC contribution as well.

MetaMask marked the production domain **Malicious / unsafe** at wallet connection. Wallet actions on `/launch` are paused while the [official review request](https://github.com/MetaMask/eth-phishing-detect/issues/296876) is pending. The exact classification reason is not yet known; absence from the repository's public blocklist does not prove a false positive. Do not bypass the warning or sign further transactions until resolved.

Use the organizer `0x844DFA170aDC069755eBF58FcccDC1e465cF88A5`, separate reviewer `0xD25a47E35bF60C9AA51E1F450f3E0e850721Fe78`, and builder-controlled demonstration vendor `0xbb431b640e57c1134af69c8014227daab8405f90`. The planned fictional LUMI campaign has a 2 USDC goal and a single 1 USDC vendor cap. Wallet holders must review and sign their own transactions. Do not describe the fictional campaign as real fan demand, goods, or an advertising placement.

After proof passes and the public Mainnet page displays the verified state, submit the site, repo, concise use case, and public builder profile through the official submission page. Actual submission has not occurred.
