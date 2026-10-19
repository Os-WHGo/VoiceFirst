import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {startPackSession,verifyChunkedPackSession,transitionPackSession} from '../dist/index.js';
const payload=new Uint8Array(1024*1024+13).fill(7);
const sha256=createHash('sha256').update(payload).digest('hex');
const pack={id:'en-ca-chunked-test',kind:'course',version:'1.0.0',bytes:payload.length,dependencies:[],locales:['en-CA'],sha256,licenseId:'test',licenseReviewed:true,sourceUrl:'https://example.org'};
function store(){let state;return {load:async()=>state?{status:'ok',state}:{status:'empty'},save:async s=>{state=s;return true;}};}
function hasher(){const h=createHash('sha256');return {update:b=>{h.update(b);},digestHex:()=>h.digest('hex')};}
function open(bytes){return async()=>({size:bytes.length,read:async(offset,count)=>bytes.subarray(offset,offset+count),close:()=>{}});}
test('chunked journal verifies complete bytes before commit',async()=>{
 const s=store();await startPackSession(pack,s);
 const ok=await verifyChunkedPackSession(pack.id,s,open(payload),hasher,{chunkBytes:65536});
 assert.equal(ok.state.phase,'verified');
 assert.equal(ok.state.verifiedSha256,sha256);
 assert.equal((await transitionPackSession(pack.id,'commit',s)).state.phase,'installed');
});
test('modified bytes reject verification and commit',async()=>{
 const s=store();await startPackSession(pack,s);
 const modified=new Uint8Array(payload);modified[0]=8;
 assert.equal((await verifyChunkedPackSession(pack.id,s,open(modified),hasher)).reason,'checksum');
 assert.equal((await transitionPackSession(pack.id,'commit',s)).status,'blocked');
});

test('byte count must match manifest even when checksum matches',async()=>{ const s=store(); const altered={...pack,bytes:payload.length+10};await startPackSession(altered,s);assert.equal((await verifyChunkedPackSession(altered.id,s,open(payload),hasher)).status,'blocked'); });
