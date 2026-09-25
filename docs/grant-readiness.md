# Arc Microgrants readiness — 2026-09-25

Official program: [Arc Microgrants](https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq). Twenty 500 USDC awards are available. It asks for a working **Arc mainnet** deployment with an openable live link, a **public** repo, a short Arc use-case description, and a public builder profile. Testnet-only builds and design mockups are explicitly ineligible. Applications close 2026-10-14 at 23:59 ET and are reviewed as they arrive. Selection looks at Arc relevance, technical credibility, build quality, and promise; no outcome can be guaranteed.

## Public material

- Repository: [openai-lover/fanpot](https://github.com/openai-lover/fanpot), public after a tracked-secret audit.
- HTTPS site: [FanPot](https://fanpot-web-one.vercel.app/). Its production build currently follows `main`; check that `/launch` and `/mainnet` are available after the pending merge and deployment.
- Arc Testnet: four clearly labelled fictional scenarios in the [transaction manifest](../apps/web/data/arc-testnet-demo.json) and [scenario guide](arc-testnet-demo.md). These demonstrate funding, payout, skipped budget, cancellation, and refunds, but are not Mainnet evidence or real fan traction.

## Mainnet proof still required

The `/launch` wallet flow and `/mainnet` public view are implemented in the current PR, but no FanPot Mainnet factory or campaign is recorded yet. The [Mainnet manifest](../apps/web/data/arc-mainnet-deployment.json) must be populated from confirmed receipts. `pnpm verify:proof` intentionally fails until it verifies factory deployment, organizer allowlisting, campaign creation, reviewer activation, and a real USDC contribution against Arc Mainnet state.

Use the organizer `0x844DFA170aDC069755eBF58FcccDC1e465cF88A5`, separate reviewer `0xD25a47E35bF60C9AA51E1F450f3E0e850721Fe78`, and builder-controlled demonstration vendor `0xbb431b640e57c1134af69c8014227daab8405f90`. The planned fictional LUMI campaign has a 2 USDC goal and a single 1 USDC vendor cap. Wallet holders must review and sign their own transactions. Do not describe the fictional campaign as real fan demand, goods, or an advertising placement.

After proof passes and the public Mainnet page displays the verified state, submit the site, repo, concise use case, and public builder profile through the official submission page. Actual submission has not occurred.
