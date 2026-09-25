# Arc Testnet fictional campaign demonstration

Created 2026-09-25 on Arc Testnet (chain ID `5042002`) using Circle faucet USDC. All named artists, fans, organizers, reviewers, and vendors in these cases are simulated. No real fan donated, no advertisement was booked, no merchandise was printed, and no real artist is affiliated with FanPot. Four simulated fan wallets and three simulated vendor wallets were generated and controlled solely for this demonstration. The user's provided wallet was not used or charged.

The story pattern was informed by [DUKPLACE's fan support guide](https://dukplace.com/en/celeb/support), which describes pooling funds for birthday subway, bus, and billboard ads, and [The Kraze's cupsleeve guide](https://thekrazemag.com/latest-updates/2025/8/27/cupsleeves-101-an-ultimate-survival-guide-to-korean-birthday-cafes), which describes café events with fan-made goods. FanPot's artwork, people, and transaction facts are separate fictional examples. These 10 USDC goals are a small testnet scale and must not be presented as commercial quotes.

| Scenario | Contract | Verifiable state |
|---|---|---|
| LUMI birthday screen | [`0xD837…a13c4`](https://explorer.testnet.arc.io/address/0xD83755bC9cb2F1a8CF4f979721c63494071a13c4) | Goal 10 USDC; 7 contributed by two simulated wallets; still funding. Caps: 8 display, 1 poster print; unallocated 1 is refunded if successfully settled. |
| LUMI fan-made cupsleeve and photocard concept | [`0x094e…76B0`](https://explorer.testnet.arc.io/address/0x094e6fF64C9190b7178418bA6B25a10DDFB076B0) | 10 contributed; 6 + 3 paid to two simulated vendor wallets; remaining 1 refunded pro rata to simulated supporters; closed. |
| LUMI birthday café concept | [`0x5142…8b5B9`](https://explorer.testnet.arc.io/address/0x5142b33c63657c4e4AD3402984b0e0e45A68b5B9) | 10 contributed; 4 + 4 paid to two simulated vendor wallets; optional signage skipped by reviewer; remaining 2 refunded to simulated supporters; closed. |
| LUMI bus shelter proposal | [`0x1db5…FA38`](https://explorer.testnet.arc.io/address/0x1db5f0a7eda9493e6F8772d28c3e5c47148aFA38) | Goal 8; 5 contributed; organizer stopped the fictional campaign before any payout and the full 5 was refunded; closed. |

The [factory](https://explorer.testnet.arc.io/address/0xaab21a0879686b0385e095fb8cb04febeacccf11) created both independent campaign contracts. The [full public manifest](../apps/web/data/arc-testnet-demo.json) records public wallet addresses and all transaction hashes, including activation, contributions, payout requests, reviewer approvals, and refunds. It contains no private keys. The `/arc-demo` page reads current totals and state directly from the Arc Testnet RPC.

## Visual concepts

The original five AI-generated images in `apps/web/public/arc-demo/` establish the subway, ad artwork, goods, café, and bus shelter concepts. Versioned `*-idol-v2.jpg` images add a consistent portrait of LUMI, an original fictional adult performer. `lumi-portrait-v2.jpg` is the identity portrait. All six new images were made with the built-in image generation tool: first a photorealistic fictional adult studio portrait with no real celebrity resemblance; then matching lavender birthday ad artwork; then precise edits placing that artwork in the subway screen and bus shelter lightbox and the same portrait on goods photocards and café display material. The source scenes and previous images remain in the directory. The site visibly identifies LUMI as fictional and the images as AI-generated concepts. They are not real idol photos or proof of an order, installation, or event.

The later `lumi-candid-v3.jpg` adds a different expression and full-body angle; `cafe-concept-candid-v3.jpg` places it on a new café poster. `vanta5-rooftop-concept-v1.jpg` and `vanta5-photobook-concept-v1.jpg` show five original fictional adult male performers in contrasting rooftop and daylight studio compositions. These four assets were also made with the built-in image generation tool. VANTA5 is a visual idea only: no VANTA5 campaign contract, contributions, or vendor transactions exist. The four existing testnet contracts remain LUMI examples, so the site does not attach their balances to the new group concept.

## How to reproduce with new testnet wallets

1. Install dependencies with `pnpm install --frozen-lockfile --ignore-scripts`.
2. Run `node scripts/create-demo-wallets.mjs`. It creates ignored `.demo/keys.json`, mode 0600, and prints only public addresses.
3. Request 20 Arc Testnet USDC from [Circle faucet](https://faucet.circle.com/) for each of the organizer and fanC addresses. The two demo scripts spend testnet USDC and gas, and transfer 7 testnet USDC from fanC to controlled demo wallet fanD.
4. Run `node scripts/compile-demo.mjs`, `node scripts/deploy-testnet-demo.mjs`, and `node scripts/deploy-extra-testnet-demo.mjs` in that order.
5. Compare the written public manifest with contract state on [Arc Testnet Explorer](https://explorer.testnet.arc.io/).

This is a script-controlled test, not an audit or a live service. Its deterministic draft references and transaction labels make reruns against the same `.demo` state idempotent. Keep `.demo/keys.json` out of Git and never fund those local keys with real assets.
