import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../../../scripts/trace-dependency-parents.mjs',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',timeout:10000});

test('dependency parent tracer identifies locked Zod dependency via Expo CLI',()=>{
  const r=run('zod');
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout);
  const zod=report.packages[0];
  assert.equal(zod.name,'zod');
  assert.ok(zod.installed.some(p=>p.version==='3.25.76'));
  assert.ok(zod.parents.some(p=>p.path==='node_modules/@expo/cli'&&p.range==='^3.25.76'));
});
test('dependency parent tracer reports missing packages as failure',()=>{
  const r=run('voicefirst-nonexistent-package-xyz');
  assert.equal(r.status,1,r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).packages[0].installed,[]);
});
test('dependency parent tracer rejects missing arguments',()=>{
  const r=run();
  assert.equal(r.status,2);
  assert.match(r.stderr,/Usage:/);
});
