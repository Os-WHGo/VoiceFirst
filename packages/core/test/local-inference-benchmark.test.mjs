import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmarkLocalInference} from '../dist/index.js';
test('benchmark records measured native adapter latency without claiming physical device results',async()=>{
 let now=100;
 const adapter={modelId:'mock-local',infer:async()=>{now+=25;return 'Bonjour'}};
 assert.deepEqual(await benchmarkLocalInference(adapter,()=>now,'lesson','help',32),{status:'measured',modelId:'mock-local',elapsedMs:25,characters:7,tokensLimit:32});
 assert.equal((await benchmarkLocalInference(adapter,()=>now,'','help')).status,'failed');
 assert.equal((await benchmarkLocalInference(adapter,()=>now,'lesson','help',999)).status,'failed');
 assert.equal((await benchmarkLocalInference({...adapter,infer:async()=>{throw Error('native failure')}},()=>now,'lesson','help')).reason,'inference-error');
 assert.equal((await benchmarkLocalInference({...adapter,infer:async()=>''},()=>now,'lesson','help')).reason,'invalid-output');
});
