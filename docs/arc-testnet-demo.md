# Arc Testnet fictional campaign demonstration

Created 2026-09-25 on Arc Testnet (chain ID `5042002`) using Circle faucet USDC. All named artists, fans, organizers, reviewers, and vendors in these cases are simulated. No real fan donated, no advertisement was booked, no merchandise was printed, and no real artist is affiliated with FanPot. Wallets for the two simulated fans and two simulated vendors were generated and controlled solely for this demonstration. The user's provided wallet was not used or charged.

The story pattern was informed by [DUKPLACE's fan support guide](https://dukplace.com/en/celeb/support), which describes pooling funds for birthday subway, bus, and billboard ads, and [The Kraze's cupsleeve guide](https://thekrazemag.com/latest-updates/2025/8/27/cupsleeves-101-an-ultimate-survival-guide-to-korean-birthday-cafes), which describes café events with fan-made goods. FanPot's artwork, people, and transaction facts are separate fictional examples. These 10 USDC goals are a small testnet scale and must not be presented as commercial quotes.

| Scenario | Contract | Verifiable state |
|---|---|---|
| LUMI birthday screen | [`0xD837…a13c4`](https://explorer.testnet.arc.io/address/0xD83755bC9cb2F1a8CF4f979721c63494071a13c4) | Goal 10 USDC; 7 contributed by two simulated wallets; still funding. Caps: 8 display, 1 poster print; unallocated 1 is refunded if successfully settled. |
| LUMI fan-made cupsleeve and photocard concept | [`0x094e…76B0`](https://explorer.testnet.arc.io/address/0x094e6fF64C9190b7178418bA6B25a10DDFB076B0) | 10 contributed; 6 + 3 paid to two simulated vendor wallets; remaining 1 refunded pro rata to simulated supporters; closed. |

The [factory](https://explorer.testnet.arc.io/address/0xaab21a0879686b0385e095fb8cb04febeacccf11) created both independent campaign contracts. The [full public manifest](../apps/web/data/arc-testnet-demo.json) records public wallet addresses and all transaction hashes, including activation, contributions, payout requests, reviewer approvals, and refunds. It contains no private keys. The `/arc-demo` page reads current totals and state directly from the Arc Testnet RPC.

## How to reproduce with new testnet wallets

1. Install dependencies with `pnpm install --frozen-lockfile --ignore-scripts`.
2. Run `node scripts/create-demo-wallets.mjs`. It creates ignored `.demo/keys.json`, mode 0600, and prints only public addresses.
3. Request at least 20 Arc Testnet USDC from [Circle faucet](https://faucet.circle.com/) for the organizer address. The script spends roughly 17 USDC in simulated contributions, plus testnet gas.
4. Run `node scripts/compile-demo.mjs` and `node scripts/deploy-testnet-demo.mjs`.
5. Compare the written public manifest with contract state on [Arc Testnet Explorer](https://explorer.testnet.arc.io/).

This is a script-controlled test, not an audit or a live service. Its deterministic draft references and transaction labels make reruns against the same `.demo` state idempotent. Keep `.demo/keys.json` out of Git and never fund those local keys with real assets.
