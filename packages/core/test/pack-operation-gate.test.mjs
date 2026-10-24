import test from 'node:test';
import assert from 'node:assert/strict';
import {PackOperationGate} from '../dist/index.js';
test('same pack is busy until first async operation settles',async()=>{
 const gate=new PackOperationGate();
 let release;
 const first=gate.run('en-ca',()=>new Promise(resolve=>{release=resolve;}));
 assert.deepEqual(await gate.run('en-ca',async()=>false),{status:'busy'});
 assert.deepEqual(await gate.run('fr-ca',async()=>42),{status:'ok',value:42});
 release('done');
 assert.deepEqual(await first,{status:'ok',value:'done'});
 assert.deepEqual(await gate.run('en-ca',async()=>true),{status:'ok',value:true});
});
test('gate releases lock even when operation throws',async()=>{
 const gate=new PackOperationGate();
 await assert.rejects(gate.run('en-ca',async()=>{throw Error('failed');}),/failed/);
 assert.equal((await gate.run('en-ca',async()=>1)).status,'ok');
 assert.deepEqual(await gate.run('../unsafe',async()=>1),{status:'busy'});
});
