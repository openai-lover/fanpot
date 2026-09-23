# Security notes — not an audit

Implemented controls: fixed budget/recipient, two monetary roles, bounded allocation loop, independent non-upgradeable contracts, exact cap checks, storage ReentrancyGuard, SafeERC20, CEI, Math.mulDiv, incoming token delta, once-only clientRefs/claims/requests, indefinite refund rights and no administrative withdrawal.

The pinned OpenZeppelin release is 5.6.1; Solidity is 0.8.30 with optimizer 200 / Cancun. Forge is 1.7.1, forge-std commit `77041d2ce690e692d6e03cc812b57d1ddaa4d505`. Contract size at the optimized build: Campaign runtime 9,482 bytes; Factory runtime 13,884 bytes, both below 24,576.

Adversarial token mocks cover incoming wrong delta, false return, revert, no return and reentrant callback. Payout and claim failures roll back accounting and flags. Zero-value claims skip the token call. The deployed v1 must use official fixed USDC via the intended Factory, not arbitrary mocks.

Remaining boundaries:

- Contracts have not received independent review or an audit and have not been tested on Arc.
- SafeERC20 return success is not proof against a future malicious change in the fixed issuer token. Incoming deltas are checked; outbound standard-USDC behavior still needs real integration validation.
- Organizer/reviewer address separation does not prove independent people. Collusion, false evidence and supplier non-delivery remain possible.
- Issuer restrictions, freezes, chain/RPC failure and lost supporter keys can block an individual recipient. No override redirects funds elsewhere.
- Privacy projection unit tests do not establish production privacy. RLS, auth, API payload/RSC/OG/cache/log leakage tests must be implemented before opening the service.
- Wallet integration, nonce/session persistence, image decoding and origin-nonce CSP are not implemented. No payment controls are enabled in the UI.
- Foundry coverage reporting failed in the Windows Solar dependency analyzer with mixed path separators; no coverage percentage is reported. Normal optimized compilation and the test suite pass.
- In this restricted Windows environment, `forge build --sizes` printed successful compilation and the size table but exited with an OS global signature-cache lookup error. The repository uses `pnpm test:contracts` for compilation/testing and `pnpm verify:size` to check actual artifacts without that global cache. Do not treat the failed command as a successful full Forge build invocation.

Before Mainnet: independent contract review, all Handoff acceptance cases, real wallet/Testnet transactions, deployment manifest / immutable bytecode verification, RPC ledger reconciliation, and the specified operational checks. Do not describe source publication or test success as audit completion.
