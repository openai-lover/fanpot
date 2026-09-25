# Arc Mainnet connection

FanPot uses its existing Viem contracts and wallet integration. [Arc Studio](https://studio.arc.io/) can help prototype, but Mainnet deployment here uses the reviewed contracts in this repository and the builder's MetaMask wallet.

The official [Arc connection reference](https://docs.arc.io/arc/references/connect-to-arc) specifies chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, and explorer `https://explorer.arc.io`. The [contract address reference](https://docs.arc.io/arc/references/contract-addresses) specifies USDC's ERC-20 interface at `0x3600000000000000000000000000000000000000` with 6 decimals. Native gas uses the same USDC balance with 18-decimal units; the UI shows only the ERC-20 USDC balance.

`/launch` contains the organizer factory, allowlisting, and campaign creation flow; a separately controlled reviewer activates a created campaign. Its wallet actions are currently paused because MetaMask flags the public domain as unsafe. `/mainnet` verifies the recorded factory and, once created, will read the campaign on chain, check its configuration against the public manifest, and present a wallet contribution action. The site labels the campaign and its imagery as fictional. The contributor would sign an exact USDC approval and a separate contribution transaction in MetaMask after the site warning is resolved.

`pnpm verify:mainnet-rpc` checks the network and token. `pnpm verify:factory` independently checks the confirmed deployment transaction, exact creation input, code presence, constructor roles, and USDC address; it passes for the recorded factory. `pnpm verify:proof` adds Mainnet campaign configuration, creation and activation events, contribution receipts, and nonzero funding. None of these checks substitutes for a contract audit or proves that an external vendor fulfilled a service.

The Mainnet manifest records the verified factory `0x8D8a8bEdE436bfF36E70d261E2041dA6F6777Ab6` and its deployment receipt. It contains no campaign address yet. The public site shows a pending campaign state until actual campaign transactions are verified and recorded.
