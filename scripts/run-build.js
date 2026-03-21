const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.createWriteStream('build-result.txt');

const proc = spawn('node', [
  require.resolve('next/dist/bin/next'),
  'build',
  '--webpack'
], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
});

proc.stdout.on('data', (d) => { process.stdout.write(d); out.write(d); });
proc.stderr.on('data', (d) => { process.stderr.write(d); out.write(d); });
proc.on('close', (code) => {
  out.write(`\n===EXIT:${code}===\n`);
  out.end();
  console.log(`\nBuild exited with code ${code}`);
  process.exit(code);
});
