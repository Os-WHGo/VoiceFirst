import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeTutorInference,lessonsFor} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('inference gate requires real model readiness, consent and canonical curriculum',()=>{
 let cases=0;
 for(const target of languages){
  const lessonId=lessonsFor(target)[0].id;
  const base={target,stage:'adult',request:{kind:'lesson',capability:'explain-phrase',lessonId,learnerText:'Please explain this phrase'},modelReady:true,guardianApproved:false,networkConsent:true,execution:'local'};
  assert.equal(authorizeTutorInference(base).status,'ready');cases++;
  for(const patch of [{modelReady:false},{execution:'online',networkConsent:false},{stage:'primary'},{stage:'primary',guardianApproved:true},{request:{...base.request,lessonId:'fabricated'}},{request:{kind:'tool',toolName:'browser',learnerText:'search'}}]){
   assert.equal(authorizeTutorInference({...base,...patch}).status,'blocked');cases++;
  }
  const online=authorizeTutorInference({...base,execution:'online'});
  assert.equal(online.status,'ready');cases++;
 }
 assert.equal(cases,48);
});
