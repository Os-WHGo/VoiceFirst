import assert from 'node:assert/strict';
import test from 'node:test';
import { translateWithFallback, TranslationError } from '../dist/index.js';
const req = {text:'Where is the bus?',source:'en-CA',target:'es',intent:'short-phrase',privacy:'approved-remote',approvedRemoteIds:['deepl','google']};
const p=(id,location,capability,cb,supports=()=>true)=>({id,location,capability,translate:cb,supports});
test('Quota error uses only approved fallback in order',async()=>{
 const out=await translateWithFallback(req,[p('deepl','remote','literal',async()=>{throw new TranslationError('RATE_LIMIT')}),p('google','remote','literal',async()=> '¿Dónde está el autobús?')]);
 assert.equal(out.providerId,'google'); assert.deepEqual(out.attempts,['deepl','google']);
});
test('Private lesson content cannot silently leave device',async()=>{
 const out=await translateWithFallback({...req,privacy:'local-only'},[
   p('deepl','remote','literal',async()=>{throw new Error('should never use remote')}),
   p('local','local','literal',async()=> '¿Dónde está el autobús?')]);
 assert.equal(out.providerId,'local');assert.deepEqual(out.attempts,['local']);
});
test('Contextual slang never falls back silently to literal translators',async()=>{
 const out=await translateWithFallback({...req,intent:'contextual',approvedRemoteIds:['context']},[
   p('deepl','remote','literal',async()=>{throw new Error('not allowed')}),
   p('context','remote','contextual',async()=> 'Una paráfrasis contextual')]);
 assert.equal(out.providerId,'context');
});
test('No silent reroute after bad authentication or policy error',async()=>{
 await assert.rejects(()=>translateWithFallback(req,[p('deepl','remote','literal',async()=>{throw new TranslationError('AUTHENTICATION')}),p('google','remote','literal',async()=>{throw Error('should not call')})]),e=>e instanceof TranslationError && e.kind==='AUTHENTICATION');
});
test('No quota means no provider call and same-language pairs rejected',async()=>{
 await assert.rejects(()=>translateWithFallback({...req,quotaRemaining:{deepl:4}},[p('deepl','remote','literal',async()=>{throw new Error('quota exhausted should have skipped')})]),e=>e instanceof TranslationError && e.kind==='UNAVAILABLE');
 await assert.rejects(()=>translateWithFallback({...req,source:'es'},[]),e=>e instanceof TranslationError && e.kind==='INVALID_REQUEST');
});
test('Unsupported pair and unapproved providers fail safely',async()=>{
 await assert.rejects(()=>translateWithFallback({...req,approvedRemoteIds:[]},[
 p('deepl','remote','literal',async()=> 'wrong'),p('local','local','literal',async()=> 'wrong',()=>false)]),e=>e instanceof TranslationError&&e.kind==='UNAVAILABLE');
});
