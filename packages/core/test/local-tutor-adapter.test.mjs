import test from 'node:test';
import assert from 'node:assert/strict';
import {runLocalTutor,lessonsFor} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('native-only tutor bridge verifies policy and never calls adapter on blocked requests',async()=>{
 let calls=0,checks=0;
 for(const target of languages){
  const model={id:'verified-local-test',runtime:'llama.cpp',languages:[target],installed:true,licenseVerified:true,deviceTested:true,memoryMb:512,contextTokens:1024};
  const adapter={modelId:model.id,infer:async()=>{calls++;return 'Practice this phrase.'}};
  const base={target,stage:'adult',request:{kind:'lesson',capability:'explain-phrase',lessonId:lessonsFor(target)[0].id,learnerText:'Explain'},candidates:[model],availableMemoryMb:1024,adapter};
  assert.equal((await runLocalTutor(base)).status,'answered');checks++;
  for(const patch of [{stage:'primary'},{adapter:null},{availableMemoryMb:128},{candidates:[{...model,installed:false}]},{request:{kind:'general',learnerText:'Browse the web'}},{maxOutputTokens:0}]){
   const before=calls;
   assert.equal((await runLocalTutor({...base,...patch})).status,'blocked');assert.equal(calls,before);checks++;
  }
  assert.equal((await runLocalTutor({...base,adapter:{modelId:model.id,infer:async()=>{throw Error('native unavailable')}}})).status,'blocked');checks++;
 }
 assert.equal(checks,48);assert.equal(calls,6);
});
