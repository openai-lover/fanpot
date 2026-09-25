import { createPublicClient, http, parseAbi } from 'viem';
import { arc } from 'viem/chains';

const rpc = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';
const usdc = '0x3600000000000000000000000000000000000000';
const client = createPublicClient({ chain: arc, transport: http(rpc, { timeout: 8000 }) });
const abi = parseAbi(['function decimals() view returns (uint8)']);

try {
  const [chainId, block, decimals, code] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
    client.readContract({ address: usdc, abi, functionName: 'decimals' }),
    client.getCode({ address: usdc }),
  ]);
  if (chainId !== arc.id) throw Error(`Wrong chain ID: ${chainId}`);
  if (decimals !== 6 || !code || code === '0x') throw Error('Arc USDC interface is missing or unexpected');
  console.log(JSON.stringify({ network: 'Arc Mainnet', chainId, block: block.toString(), usdc, erc20Decimals: decimals, rpc }, null, 2));
} catch (error) {
  console.error(`Arc Mainnet read-only preflight failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
