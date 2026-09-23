import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const std = 'packages/contracts/lib/forge-std';
const commit = '77041d2ce690e692d6e03cc812b57d1ddaa4d505';
function git(args) { const result = spawnSync('git', args, { encoding: 'utf8' }); if (result.status !== 0) throw Error(result.stderr); return result.stdout.trim(); }
if (!existsSync(std)) {
  git(['clone', '--depth', '1', '--branch', 'v1.9.7', 'https://github.com/foundry-rs/forge-std.git', std]);
}
if (git(['-C', std, 'rev-parse', 'HEAD']) !== commit) throw Error('forge-std commit mismatch');
if (process.platform === 'win32') {
  const file = 'solc-windows-amd64-v0.8.30+commit.73712a01.exe';
  const response = await fetch(`https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/windows-amd64/${file}`);
  if (!response.ok) throw Error('Solc download failed');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== 'ccbd3ed44d5fbd26fe039702d403421f1212d2e8752e3cbe3bfd074986911586') throw Error('Solc checksum mismatch');
  mkdirSync('.tools', { recursive: true }); writeFileSync('.tools/solc.exe', bytes);
}
console.log('Pinned forge-std ready; Solidity 0.8.30 configured.');
