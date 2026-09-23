# Architecture — local foundation

Browser → (future server: SIWE / metadata / indexing) → public chain reads.
Wallet → fixed USDC → individual Campaign contract. The server never signs monetary actions.

Factory owns an organizer allowlist and a deployment registry only. Campaigns are complete deployments, not clones or proxies. Roles, goal, deadlines, token, rules hash and budget recipients/caps are immutable in application behavior. Allocation configuration is private storage without mutation methods; request state is separate.

Phase and Outcome are distinct. Successful outcome survives cancellation after funding. Progress must use totalContributed, never token.balanceOf. The accounting identity is:

`accounted = totalContributed - totalPaid - totalRefunded`.

Settlement freezes `refundPool = totalContributed - totalPaid`. Each original supporter can receive `floor(contribution * refundPool / totalContributed)`. Nobody can sweep dust or unregistered direct transfers. A blocked recipient does not prevent other claims.

Deadline is exclusive for contributions. settleBy is exclusive for payouts and inclusive for permissionless settlement. Activation requires at least 24 hours remaining. An external transaction is always needed to change stored phase after time passes.

Rules use RFC 8785 canonicalization through the pinned canonicalize package, not handwritten crypto. Chain receipt acceptance requires exact chain, sender, contract, amount, random clientRef, tx hash and one matching successful Contributed log. The helper validates an already-fetched receipt; RPC selection, finality checking, persisted intent ownership and server reconciliation remain to implement.

Public supporter output is an explicit allowlist of random public row ID, display name, optional amount and avatar seed. It intentionally omits wallet, transaction, clientRef, ordinal and timestamp. This helper alone is not a complete privacy boundary until API/DB/cache ownership controls exist.

The preview intentionally does not configure a wallet provider, connect a database or make financial RPC calls. Production configuration checks cannot activate missing integrations.

Arc reference values were checked against official sources during development: [connection settings](https://docs.arc.io/arc/references/connect-to-arc), [USDC system address](https://docs.arc.io/arc/references/contract-addresses). Deployment must independently verify chain 5042, fresh block timestamps, 6-decimal ERC20 behavior and FanPot runtime bytecode. Native gas uses 18 decimals and represents the same USDC balance.
