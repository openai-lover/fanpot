import { validateProductionConfig } from '../packages/shared/config.ts';
const problems = validateProductionConfig(process.env);
if (problems.length) { console.error(`Production is not configured:\n${problems.join('\n')}`); process.exit(1); }
// This is a configuration gate only. It does not claim RPC/bytecode/deployment verification.
console.log('Configuration shape passed. RPC/bytecode preflight and deployment review are still required.');
