import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {hashFileByChunks} from '../dist/index.js';
function fixture(bytes,{alterRead,alterSize,onClose}={}){
 let calls=0;let closed=0;
 const source={get size(){return alterSize?.(calls)??bytes.byteLength;},
  async read(offset,length){calls++;return alterRead?alterRead(bytes,offset,length,calls):bytes.subarray(offset,offset+length);},
  close(){closed++;onClose?.();}
 };
 return {open:async()=>source,calls:()=>calls,closed:()=>closed};
}
const native=()=>{const hash=createHash('sha256');return {update:chunk=>{hash.update(chunk);},digestHex:()=>hash.digest('hex')};};
test('multi-megabyte hashes match independent Node SHA-256 without full-file reads',async()=>{
 const bytes=randomBytes(3*1024*1024+17), source=fixture(bytes);
 const result=await hashFileByChunks(source.open,native,{chunkBytes:131072});
 assert.deepEqual(result,{status:'ok',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 assert.equal(source.calls(),25);
 assert.equal(source.closed(),1);
});
test('truncated chunks are rejected and source closed',async()=>{
 const bytes=randomBytes(1000), source=fixture(bytes,{alterRead:(b,offset,length)=>b.subarray(offset,offset+length-1)});
 assert.deepEqual(await hashFileByChunks(source.open,native,{chunkBytes:128}),{status:'blocked',reason:'short-read'});
 assert.equal(source.closed(),1);
});
test('modification of recorded file size blocks success',async()=>{
 const bytes=randomBytes(1000),source=fixture(bytes,{alterSize:calls=>calls?1001:1000});
 assert.deepEqual(await hashFileByChunks(source.open,native,{chunkBytes:128}),{status:'blocked',reason:'size-changed'});
 assert.equal(source.closed(),1);
});
test('source too large never opens a chunk and still closes',async()=>{
 const source=fixture(new Uint8Array(1024));
 assert.deepEqual(await hashFileByChunks(source.open,native,{maxBytes:512}),{status:'blocked',reason:'too-large'});
 assert.equal(source.calls(),0);assert.equal(source.closed(),1);
});
test('cancelled streams reject before reading or committing a digest',async()=>{
 const source=fixture(new Uint8Array(1024));
 assert.deepEqual(await hashFileByChunks(source.open,native,{isCancelled:()=>true}),{status:'blocked',reason:'cancelled'});
 assert.equal(source.calls(),0);assert.equal(source.closed(),1);
});
test('reader and hasher errors fail closed',async()=>{
 const source=fixture(new Uint8Array(1024),{alterRead:()=>{throw Error('read');}});
 assert.deepEqual(await hashFileByChunks(source.open,native),{status:'blocked',reason:'read'});
 assert.deepEqual(await hashFileByChunks(async()=>{throw Error('open');},native),{status:'blocked',reason:'open'});
 const second=fixture(new Uint8Array(1024));
 assert.deepEqual(await hashFileByChunks(second.open,()=>({update:()=>{},digestHex:()=> 'wrong'})),{status:'blocked',reason:'hash'});
});
test('rejects oversized chunks and closes on failed close',async()=>{
 const source=fixture(new Uint8Array(1024),{onClose:()=>{throw Error('close');}});
 assert.deepEqual(await hashFileByChunks(source.open,native,{chunkBytes:2*1024*1024}),{status:'blocked',reason:'chunk-size'});
 assert.deepEqual(await hashFileByChunks(source.open,native),{status:'blocked',reason:'close'});
});
