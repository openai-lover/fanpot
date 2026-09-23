// Direct child processes ensure deterministic cleanup on Windows, without shell process trees.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { once } from 'node:events';
const require = createRequire(import.meta.url);
const webRequire = createRequire(resolve('apps/web/package.json'));
try { await fetch('http://127.0.0.1:3000', { signal: AbortSignal.timeout(1000) }); throw Error('Port 3000 already in use; stop the preview before E2E.'); }
catch (e) { if (e.message.startsWith('Port 3000')) throw e; }
const server = spawn(process.execPath, [webRequire.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1'], { cwd: resolve('apps/web'), stdio: 'ignore' });
const serverClosed = once(server, 'close');
let runner;
function cleanup() { if (runner && runner.exitCode === null) runner.kill(); if (server.exitCode === null) server.kill(); }
process.on('SIGINT', cleanup); process.on('SIGTERM', cleanup);
let exitCode = 1;
try {
  let ready = false;
  for (let i = 0; i < 100 && server.exitCode === null; i++) {
    try { const r = await fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(1000) }); if (r.ok) { ready = true; break; } } catch { /* server still starting */ }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!ready) throw Error('Local Next server did not start. Run pnpm build:local first.');
  const cli = join(dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
  runner = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], { stdio: 'inherit' });
  const [code] = await once(runner, 'close'); exitCode = code ?? 1;
} finally { cleanup(); await serverClosed; }
process.exit(exitCode);
