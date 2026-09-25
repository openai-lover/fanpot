import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const file = '.demo/keys.json';
if (existsSync(file)) throw Error(`${file} already exists; refusing to replace testnet wallets`);
mkdirSync('.demo', { recursive: true });
const roles = ['organizer', 'reviewer', 'fanA', 'fanB', 'adVendor', 'printVendor'];
const keys = Object.fromEntries(roles.map((role) => {
  const privateKey = generatePrivateKey();
  return [role, { address: privateKeyToAccount(privateKey).address, privateKey }];
}));
writeFileSync(file, JSON.stringify(keys, null, 2), { mode: 0o600 });
for (const [role, key] of Object.entries(keys)) console.log(`${role}: ${key.address}`);
console.log(`Private keys saved in ignored ${file}. Never commit or share this file.`);
