import test from 'node:test';
import assert from 'node:assert/strict';
import {selectLocalTextModel,lessonsFor,authorizeTutorInference} from '../dist/index.js';
const langs=['en-CA','fr-CA','es','pt-BR','de','it'];
test('local model selection fails closed across six languages and 84 lessons',()=>{
 let checks=0;
 for(const target of langs){
  const candidate={id:'test-model',runtime:'llama.cpp',languages:[target],installed:true,licenseVerified:true,deviceTested:true,memoryMb:700,contextTokens:1024};
  assert.equal(selectLocalTextModel(target,[candidate],1024).status,'ready');checks++;
  for(const patch of [{installed:false},{licenseVerified:false},{deviceTested:false},{memoryMb:2000},{contextTokens:128}]){
   assert.notEqual(selectLocalTextModel(target,[{...candidate,...patch}],1024).status,'ready');checks++;
  }
  for(const lesson of lessonsFor(target)){
   const result=authorizeTutorInference({target,stage:'adult',request:{kind:'lesson',capability:'explain-phrase',lessonId:lesson.id,learnerText:'Help'},modelReady:true,guardianApproved:false,networkConsent:false,execution:'local'});
   assert.equal(result.status,'ready');checks++;
  }
 }
 assert.equal(checks,120);
});
