# Arc Mainnet connection

FanPot uses its existing Viem integration for a read-only Mainnet connection. [Arc Studio](https://studio.arc.io/) can generate and test apps, but its current site describes one-click contract deployment on testnets and says it does not sign, fund, or submit Mainnet transactions for users. Keeping FanPot's reviewed contracts and wallet flow in this repository avoids replacing them with generated code just to connect to Mainnet.

The official [Arc connection reference](https://docs.arc.io/arc/references/connect-to-arc) specifies chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, and explorer `https://explorer.arc.io`. The [contract address reference](https://docs.arc.io/arc/references/contract-addresses) specifies USDC's ERC-20 interface at `0x3600000000000000000000000000000000000000` with 6 decimals. Native gas uses the same USDC balance with 18-decimal units; the UI shows only the ERC-20 USDC balance.

`/mainnet` verifies the chain ID, latest block, USDC contract code, and `decimals()` on each request. Its wallet button asks MetaMask for the address, switches to Arc Mainnet when needed, and reads `balanceOf`. It never asks for a signature, approval, or contribution. `pnpm verify:mainnet-rpc` performs the same network preflight from the command line without connecting a wallet. This is a network and token check, not a contract audit or deployment proof.

No FanPot Mainnet factory or campaign has been deployed. The four existing campaign contracts and the interactive contribution action remain explicitly on Arc Testnet. Mainnet contribution controls must stay unavailable until a reviewed contract is deployed, verified, and linked to the product. The production config and proof gates remain separate from this read-only connection.
