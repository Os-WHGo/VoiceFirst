import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sha256Bytes} from '../dist/index.js';
const digest=x=>createHash('sha256').update(x).digest('hex');
test('offline streaming independent SHA256 works across block boundaries',()=>{
  for(const length of [0,1,3,55,56,57,63,64,65,255,1024,33001,82000]){
    const source=Uint8Array.from({length},(_,i)=>i*19%251);
    assert.equal(sha256Bytes(source),digest(source),`SHA at length ${length}`);
  }
});
test('hash rejects non-bytes and files larger than allowed voice-clip limit',()=>{
  assert.throws(()=>sha256Bytes('hello'),/Invalid/);
  assert.throws(()=>sha256Bytes(new Uint8Array(8*1024*1024+1)),/oversized/);
});
