import test from 'node:test';
import assert from 'node:assert/strict';
import {startPackSession,transitionPackSession,verifyStagedPackSession} from '../dist/index.js';
const digest='a'.repeat(64);
const pack={id:'en-ca-core',kind:'course',version:'1.0.0',bytes:100,dependencies:[],locales:['en-CA'],sha256:digest,licenseId:'test',licenseReviewed:true,sourceUrl:'https://example.org'};
const store=()=>{
 let state=null;let fail=false;
 return {load:async()=>state?{status:'ok',state}:{status:'empty'},save:async(next)=>{if(fail)return false;state=next;return true;},setFail:(v)=>{fail=v;}};
};
test('session persists staging, verification and commit in order',async()=>{
 const s=store();
 assert.equal((await startPackSession(pack,s)).state.phase,'staging');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).status,'blocked');
 assert.equal((await transitionPackSession(pack.id,'verify',s,'b'.repeat(64))).status,'blocked');
 assert.equal((await transitionPackSession(pack.id,'verify',s,digest)).state.phase,'verified');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).state.phase,'installed');
 assert.equal((await startPackSession(pack,s)).reason,'existing-journal');
});
test('session does not report success when journal write fails',async()=>{
 const s=store();s.setFail(true);
 assert.equal((await startPackSession(pack,s)).reason,'write');
 s.setFail(false);
 await startPackSession(pack,s);
 s.setFail(true);
 assert.equal((await transitionPackSession(pack.id,'verify',s,digest)).reason,'write');
});

test('dependent pack requires an installed verified dependency journal',async()=>{
 const entries=new Map();
 const s={load:async(id)=>entries.has(id)?{status:'ok',state:entries.get(id)}:{status:'empty'},save:async(state)=>{entries.set(state.id,state);return true;}};
 const dependent={...pack,id:'en-ca-dialogue',dependencies:[pack.id]};
 assert.equal((await startPackSession(dependent,s)).reason,'dependencies');
 await startPackSession(pack,s);
 assert.equal((await startPackSession(dependent,s)).reason,'dependencies');
 await transitionPackSession(pack.id,'verify',s,digest);
 await transitionPackSession(pack.id,'commit',s);
 assert.equal((await startPackSession(dependent,s)).status,'ok');
});

test('byte-backed verification refuses missing or mismatched staged data',async()=>{
 const s=store();await startPackSession(pack,s);
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>null)).reason,'staged-file-read');
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>{throw Error('missing');})).reason,'staged-file-read');
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=> 'f'.repeat(64))).reason,'checksum');
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>digest)).state.phase,'verified');
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>digest)).reason,'missing-or-invalid-staging');
});

test('malformed manifest never accesses dependency storage',async()=>{
 let reads=0;
 const s={load:async()=>{reads++;throw Error('must not read');},save:async()=>{throw Error('must not write');}};
 for(const bad of [
  {...pack,dependencies:[null]},
  {...pack,dependencies:['../escape']},
  {...pack,dependencies:[pack.id],sha256:'invalid'},
  {...pack,dependencies:'not-an-array'}
 ]){
  assert.equal((await startPackSession(bad,s)).reason,'manifest');
 }
 assert.equal(reads,0);
});

test('concurrent session starts cannot both create a journal',async()=>{
 let resolveLoad;
 const waiting=new Promise(resolve=>{resolveLoad=resolve;});
 let saves=0;
 const s={load:async()=>{await waiting;return {status:'empty'};},save:async()=>{saves++;return true;}};
 const first=startPackSession(pack,s);
 assert.equal((await startPackSession(pack,s)).reason,'operation-busy');
 resolveLoad();
 assert.equal((await first).status,'ok');
 assert.equal(saves,1);
});
test('concurrent transitions on same pack reject second operation',async()=>{
 let unblock;
 const waiting=new Promise(resolve=>{unblock=resolve;});
 const state={id:pack.id,version:pack.version,phase:'staging',expectedSha256:digest};
 const s={load:async()=>{await waiting;return {status:'ok',state};},save:async()=>true};
 const first=transitionPackSession(pack.id,'verify',s,digest);
 assert.equal((await transitionPackSession(pack.id,'abort',s)).reason,'operation-busy');
 unblock();
 assert.equal((await first).status,'ok');
});

test('byte verification keeps journal locked across slow hash callback',async()=>{
 const s=store();await startPackSession(pack,s);
 let beginHash;let finishHash;
 const hashing=new Promise(resolve=>{finishHash=resolve;});
 const started=new Promise(resolve=>{beginHash=resolve;});
 const verify=verifyStagedPackSession(pack.id,s,async()=>{beginHash();await hashing;return digest;});
 await started;
 assert.equal((await transitionPackSession(pack.id,'abort',s)).reason,'operation-busy');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).reason,'operation-busy');
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>digest)).reason,'operation-busy');
 finishHash();
 assert.equal((await verify).state.phase,'verified');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).state.phase,'installed');
});
test('failed byte hashing releases journal gate without advancing phase',async()=>{
 const s=store();await startPackSession(pack,s);
 assert.equal((await verifyStagedPackSession(pack.id,s,async()=>{throw Error('IO');})).reason,'staged-file-read');
 assert.equal((await transitionPackSession(pack.id,'abort',s)).state.phase,'failed');
});
