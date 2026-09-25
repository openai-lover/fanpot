# Arc Mainnet connection

FanPot uses its existing Viem contracts and wallet integration. [Arc Studio](https://studio.arc.io/) can help prototype, but Mainnet deployment here uses the reviewed contracts in this repository and the builder's MetaMask wallet.

The official [Arc connection reference](https://docs.arc.io/arc/references/connect-to-arc) specifies chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, and explorer `https://explorer.arc.io`. The [contract address reference](https://docs.arc.io/arc/references/contract-addresses) specifies USDC's ERC-20 interface at `0x3600000000000000000000000000000000000000` with 6 decimals. Native gas uses the same USDC balance with 18-decimal units; the UI shows only the ERC-20 USDC balance.

`/launch` asks the organizer to sign factory deployment, allowlisting, and campaign creation. A separately controlled reviewer signs activation from the campaign link. `/mainnet` reads the recorded factory and campaign on chain, checks their configuration against the public manifest, and presents a wallet contribution action once deployment evidence has been committed. The site labels the campaign and its imagery as fictional. The contributor signs USDC approval and contribution transactions in MetaMask.

`pnpm verify:mainnet-rpc` checks the network and token. `pnpm verify:proof` checks Mainnet bytecode, roles, configuration, creation and activation events, contribution receipts, and nonzero funding. Neither command substitutes for a contract audit or proves that an external vendor fulfilled a service.

The Mainnet manifest currently contains no factory or campaign address. The public site will show a pending state until actual transactions are verified and recorded.
