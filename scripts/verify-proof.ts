import { existsSync, readFileSync } from 'node:fs';
const path = 'deployments/5042/manifest.json';
if (!existsSync(path)) { console.error('No actual Mainnet deployment manifest. Proof is incomplete.'); process.exit(1); }
const raw = readFileSync(path, 'utf8');
if (/ACTUAL_|<[^>]+>|placeholder/i.test(raw)) { console.error('Proof contains placeholders.'); process.exit(1); }
// Full RPC receipt/bytecode verifier is a later deployment milestone. Never pass on JSON alone.
console.error('Live receipt and immutable bytecode verification is not implemented yet. Proof cannot pass.');
process.exit(1);
