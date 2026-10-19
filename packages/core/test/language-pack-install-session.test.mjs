import test from 'node:test';
import assert from 'node:assert/strict';
import {startPackSession,retryPackSession,transitionPackSession,verifyStagedPackSession} from '../dist/index.js';
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

test('failed session requires explicit retry',async()=>{const s=store();await startPackSession(pack,s);assert.equal((await retryPackSession(pack,s)).status,'blocked');await transitionPackSession(pack.id,'abort',s);assert.equal((await startPackSession(pack,s)).status,'blocked');assert.equal((await retryPackSession(pack,s)).state.phase,'staging');assert.equal((await retryPackSession(pack,s)).status,'blocked');});

test('session coordinator passes exact expected journal snapshot to conditional writes',async()=>{
 const saved=[];
 let state=null;
 const s={
  load:async()=>state?{status:'ok',state}:{status:'empty'},
  save:async(next,expected)=>{
   saved.push({next,expected});
   if(expected===null ? state!==null : JSON.stringify(state)!==JSON.stringify(expected))return false;
   state=next;return true;
  }
 };
 assert.equal((await startPackSession(pack,s)).status,'ok');
 assert.equal(saved[0].expected,null);
 assert.equal((await transitionPackSession(pack.id,'verify',s,digest)).status,'ok');
 assert.equal(saved[1].expected.phase,'staging');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).status,'ok');
 assert.equal(saved[2].expected.phase,'verified');
 assert.equal((await transitionPackSession(pack.id,'abort',s)).status,'blocked');
 assert.equal(saved.length,3);
});
test('failed retry passes the failed snapshot, never a blind overwrite',async()=>{
 const prior={id:pack.id,version:pack.version,phase:'failed',expectedSha256:digest,expectedBytes:pack.bytes};
 let state=prior;let expectedSeen;
 const s={load:async()=>({status:'ok',state}),save:async(next,expected)=>{expectedSeen=expected;state=next;return true;}};
 assert.equal((await retryPackSession(pack,s)).status,'ok');
 assert.deepEqual(expectedSeen,prior);
 assert.equal(state.phase,'staging');
});

test('restart advances generation beyond aborted staging even when manifest matches',async()=>{
 const s=store();
 const original=(await startPackSession(pack,s)).state;
 assert.equal(original.revision,0);
 const failed=(await transitionPackSession(pack.id,'abort',s)).state;
 assert.equal(failed.revision,1);
 const retried=(await retryPackSession(pack,s)).state;
 assert.equal(retried.revision,2);
 assert.equal(retried.phase,'staging');
 assert.equal(retried.expectedSha256,original.expectedSha256);
 assert.equal((await transitionPackSession(pack.id,'verify',s,digest)).state.revision,3);
 assert.equal((await transitionPackSession(pack.id,'commit',s)).state.revision,4);
});
test('retry refuses a revision that cannot be advanced safely',async()=>{
 const stuck={id:pack.id,version:pack.version,phase:'failed',expectedSha256:digest,expectedBytes:pack.bytes,revision:Number.MAX_SAFE_INTEGER};
 let saves=0;
 const s={load:async()=>({status:'ok',state:stuck}),save:async()=>{saves++;return true;}};
 assert.equal((await retryPackSession(pack,s)).reason,'revision-overflow');
 assert.equal(saves,0);
});

test('failed retry cannot silently substitute version, checksum or payload size',async()=>{
 const s=store();
 await startPackSession(pack,s);
 const failed=(await transitionPackSession(pack.id,'abort',s)).state;
 const alternatives=[
  {...pack,version:'2.0.0'},
  {...pack,sha256:'b'.repeat(64)},
  {...pack,bytes:pack.bytes+1}
 ];
 for(const changed of alternatives){
  const result=await retryPackSession(changed,s);
  assert.deepEqual(result,{status:'blocked',reason:'retry-manifest-changed'});
  assert.equal((await s.load(pack.id)).state.revision,failed.revision);
  assert.equal((await s.load(pack.id)).state.phase,'failed');
 }
 assert.equal((await retryPackSession(pack,s)).state.phase,'staging');
});

test('legacy journal missing expected byte count cannot be silently rewritten on retry',async()=>{
 const legacy={id:pack.id,version:pack.version,phase:'failed',expectedSha256:digest};
 let writes=0;
 const s={load:async()=>({status:'ok',state:legacy}),save:async()=>{writes++;return true;}};
 assert.equal((await retryPackSession(pack,s)).reason,'retry-manifest-changed');
 assert.equal(writes,0);
});

test('wrong-id journal returned by a storage adapter never authorizes transitions',async()=>{
 let writes=0;
 const other={id:'fr-ca-core',version:pack.version,phase:'verified',expectedSha256:digest,expectedBytes:pack.bytes,verifiedSha256:digest};
 const s={load:async()=>({status:'ok',state:other}),save:async()=>{writes++;return true;}};
 assert.equal((await transitionPackSession(pack.id,'commit',s)).reason,'missing-or-unreadable-journal');
 assert.equal((await retryPackSession(pack,s)).reason,'journal-not-failed');
 assert.equal(writes,0);
});

test('slow hashing cannot verify a newer journal revision from another runtime',async()=>{
 let current={id:pack.id,version:pack.version,phase:'staging',expectedSha256:digest,expectedBytes:pack.bytes,revision:3};
 let writes=0;
 const s={load:async()=>({status:'ok',state:current}),save:async()=>{writes++;return true;}};
 const result=await verifyStagedPackSession(pack.id,s,async()=>{
  current={...current,revision:4};
  return digest;
 });
 assert.deepEqual(result,{status:'blocked',reason:'journal-changed'});
 assert.equal(writes,0);
});
test('stale promoted-file snapshot is rejected after version or revision changed',async()=>{
 const {commitPackSessionIfUnchanged}=await import('../dist/index.js');
 const old={id:pack.id,version:pack.version,phase:'verified',expectedSha256:digest,expectedBytes:pack.bytes,verifiedSha256:digest,revision:3};
 let current={...old,revision:4,version:'2.0.0'},writes=0;
 const s={load:async()=>({status:'ok',state:current}),save:async()=>{writes++;return true;}};
 assert.deepEqual(await commitPackSessionIfUnchanged(pack.id,s,old),{status:'blocked',reason:'journal-changed'});
 assert.equal(writes,0);
});
test('snapshot-bound commit advances a verified journal once only',async()=>{
 const {commitPackSessionIfUnchanged}=await import('../dist/index.js');
 let current={id:pack.id,version:pack.version,phase:'verified',expectedSha256:digest,expectedBytes:pack.bytes,verifiedSha256:digest,revision:2};
 const snapshot={...current};
 const s={load:async()=>({status:'ok',state:current}),save:async(next,prior)=>{if(current.revision!==prior.revision)return false;current=next;return true;}};
 assert.equal((await commitPackSessionIfUnchanged(pack.id,s,snapshot)).status,'ok');
 assert.equal(current.revision,3);
 assert.equal(current.phase,'installed');
 assert.equal((await commitPackSessionIfUnchanged(pack.id,s,snapshot)).status,'blocked');
});
test('journal snapshot compares phase, digest, bytes and strict revision',async()=>{
 const {samePackJournalSnapshot}=await import('../dist/index.js');
 const state={id:pack.id,version:pack.version,phase:'verified',expectedSha256:digest,expectedBytes:pack.bytes,verifiedSha256:digest,revision:1};
 assert.equal(samePackJournalSnapshot(state,{...state}),true);
 for(const change of [{revision:undefined},{revision:2},{version:'2.0.0'},{phase:'failed'},{expectedBytes:pack.bytes+1},{expectedSha256:'b'.repeat(64)}])
  assert.equal(samePackJournalSnapshot(state,{...state,...change}),false);
});
