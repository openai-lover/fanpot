import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import solc from 'solc';

const files = ['FanPotFactory.sol', 'FanPotCampaign.sol', 'IFanPotCampaign.sol'];
const sources = Object.fromEntries(files.map((name) => [
  `packages/contracts/src/${name}`,
  { content: readFileSync(`packages/contracts/src/${name}`, 'utf8') },
]));
const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'cancun',
    metadata: { bytecodeHash: 'ipfs' },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), {
  import: (name) => {
    const file = name.startsWith('@openzeppelin/') ? resolve('node_modules', name) : resolve(name);
    try { return { contents: readFileSync(file, 'utf8') }; }
    catch { return { error: `Import not found: ${name}` }; }
  },
}));
const errors = (output.errors ?? []).filter((item) => item.severity === 'error');
if (errors.length) throw Error(errors.map((item) => item.formattedMessage).join('\n'));
mkdirSync('.demo/build', { recursive: true });
for (const name of ['FanPotFactory', 'FanPotCampaign']) {
  const contract = output.contracts[`packages/contracts/src/${name}.sol`][name];
  writeFileSync(`.demo/build/${name}.json`, JSON.stringify({
    compiler: solc.version(), abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  }, null, 2));
  console.log(`${name}: ${contract.evm.deployedBytecode.object.length / 2} runtime bytes`);
}
