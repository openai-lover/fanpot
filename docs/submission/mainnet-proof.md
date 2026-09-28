# FanPot — complete Arc Mainnet lifecycle

**Funding → organizer request → reviewer-approved payment → settlement → supporter refund. All confirmed on Arc Mainnet.**

Verified September 28, 2026, at block 23145237. Chain ID: 5042. Final state: **Closed**.

[Open the live campaign](https://fanpot-web-one.vercel.app/mainnet) · [Inspect the campaign contract](https://explorer.arc.io/address/0x82f2C8E937a26Af861F5614181863889218ab11E)

| Step | Confirmed result | Receipt |
| --- | --- | --- |
| Funding completed | Goal reached; contributions total 2 USDC. | [View transaction](https://explorer.arc.io/tx/0x2436691d3a300972630a9c6fef9ac4893c9f8339262192079168c7bba1d6d05a) |
| Organizer requested payment | Committed a 1 USDC request and the payout record hash. | [View transaction](https://explorer.arc.io/tx/0xe2db592684054d793d324e31168671beeafe6218315656fb955f1f253e306434) |
| Reviewer approved and paid | Separate reviewer wallet approved; 1 USDC sent to the fixed recipient. | [View transaction](https://explorer.arc.io/tx/0x6ad7d0d0dae0dacb54d0133913a7b58000cb588d7e4c39f05c5d50e1c3f587c9) |
| Campaign settled | Unused 1 USDC opened for supporter refunds. | [View transaction](https://explorer.arc.io/tx/0x4f59f8529aab7437c057a119e621cd2b934c1e57687a43e33ce3576c9d6ef081) |
| Supporter claimed refund | 1 USDC returned; campaign closed with zero accounted balance. | [View transaction](https://explorer.arc.io/tx/0xfec3bd2a0f237412351127d93cd72791e80e9cbf6aa0e8a964ff60525bb85c91) |

**Reconciled:** 2 USDC contributed = 1 USDC paid + 1 USDC refunded. Network fees are separate.

This controlled execution used real Mainnet USDC and three distinct builder-owned wallets for organizer, reviewer and recipient. It verifies the implemented funding, approval, payout and refund flow; it does not claim independent users or delivery of an advertisement. Evidence hashes commit to a record, not proof of offchain delivery.

## Reproduce the verification

From the repository root, install dependencies and run `pnpm verify:proof`. The verifier checks chain ID, deployment/configuration, successful transaction receipts, caller roles, lifecycle events, USDC transfer events and the final reconciled state.
