import { readFileSync } from 'node:fs';
for (const name of ['FanPotCampaign', 'FanPotFactory']) {
  const artifact = JSON.parse(readFileSync(`packages/contracts/out/${name}.sol/${name}.json`, 'utf8'));
  const runtime = artifact.deployedBytecode.object.replace(/^0x/, '').length / 2;
  const creation = artifact.bytecode.object.replace(/^0x/, '').length / 2;
  if (!runtime || runtime > 24576 || creation > 49152) throw Error(`${name}: bytecode size limit exceeded`);
  console.log(`${name}: runtime ${runtime}/24576 bytes; initcode ${creation}/49152 bytes`);
}
