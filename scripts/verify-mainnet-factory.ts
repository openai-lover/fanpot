import { readFileSync } from 'node:fs';
import { createPublicClient, encodeDeployData, formatUnits, getAddress, http, isAddress } from 'viem';
import { arc } from 'viem/chains';
import { fanPotFactoryAbi } from '../packages/shared/abi/FanPotFactory.ts';
import { ARC_USDC } from '../packages/shared/chain.ts';

type Manifest = { chainId: number; factory: string | null; organizer: string; reviewer: string; transactions: Record<string, string> };
const manifest = JSON.parse(readFileSync('apps/web/data/arc-mainnet-deployment.json', 'utf8')) as Manifest;
const build = JSON.parse(readFileSync('apps/web/data/mainnet-factory-bytecode.json', 'utf8')) as { compiler: string; bytecode: `0x${string}` };
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw Error(message); }
const same = (a: string | null | undefined, b: string) => a?.toLowerCase() === b.toLowerCase();

async function main() {
  assert(manifest.chainId === 5042, 'Manifest is not for Arc Mainnet');
  assert(manifest.factory && isAddress(manifest.factory) && isAddress(manifest.organizer) && isAddress(manifest.reviewer), 'Factory or role address is invalid');
  const hash = manifest.transactions['deploy-factory'];
  assert(/^0x[0-9a-fA-F]{64}$/.test(hash ?? ''), 'Factory deployment transaction is missing');
  const factory = getAddress(manifest.factory);
  const organizer = getAddress(manifest.organizer);
  const reviewer = getAddress(manifest.reviewer);
  assert(!same(organizer, reviewer), 'Organizer and reviewer must be different');
  const client = createPublicClient({ chain: arc, transport: http(process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io') });
  assert(await client.getChainId() === 5042, 'RPC is not Arc Mainnet');
  const [code, receipt, transaction, owner, fixedReviewer, usdc] = await Promise.all([
    client.getCode({ address: factory }),
    client.getTransactionReceipt({ hash: hash as `0x${string}` }),
    client.getTransaction({ hash: hash as `0x${string}` }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'owner' }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'reviewer' }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'usdc' }),
  ]);
  assert(code && code !== '0x', 'Factory has no deployed code');
  assert(receipt.status === 'success' && same(receipt.contractAddress, factory) && same(receipt.from, organizer), 'Deployment receipt does not match the manifest');
  assert(transaction.to === null && transaction.value === 0n, 'Deployment sent funds or targeted another contract');
  assert(same(owner, organizer) && same(fixedReviewer, reviewer) && same(usdc, ARC_USDC), 'Factory role or USDC configuration differs');
  const expected = encodeDeployData({ abi: fanPotFactoryAbi, bytecode: build.bytecode, args: [organizer, reviewer, ARC_USDC] });
  assert(transaction.input === expected, 'Factory creation bytecode or constructor arguments differ from the checked-in build');
  console.log(JSON.stringify({ chainId: 5042, factory, organizer, reviewer, usdc, compiler: build.compiler, deployedBytecodeBytes: (code.length - 2) / 2, transaction: hash, blockNumber: receipt.blockNumber.toString(), gasFeeUsdc: formatUnits(receipt.gasUsed * receipt.effectiveGasPrice, 18) }, null, 2));
}

main().catch((error) => { console.error(`Factory verification failed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
