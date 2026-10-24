import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPcmWav} from '../dist/index.js';

function sample(){
 const rate=16000,frames=rate/4,b=new Uint8Array(44+frames*2),view=new DataView(b.buffer);
 for(const [at,word] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])
  for(let i=0;i<4;i++)b[at+i]=word.charCodeAt(i);
 view.setUint32(4,b.length-8,true);view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 view.setUint32(40,frames*2,true);
 for(let i=0;i<frames;i++)view.setInt16(44+i*2,Math.round(1500*Math.sin(2*Math.PI*320*i/rate)),true);
 return b;
}
test('accepts actual audible PCM16 WAV and exact expected duration',()=>{
 const result=inspectPcmWav(sample(),250);
 assert.deepEqual(result,{valid:true,durationMs:250,sampleRate:16000,channels:1});
});
test('a RIFF/WAVE header without structurally valid chunks is rejected',()=>{
 const fixture=sample();
 const mutations=[
  b=>new DataView(b.buffer).setUint32(4,b.length+4,true),
  b=>new DataView(b.buffer).setUint32(40,b.length*2,true),
  b=>new DataView(b.buffer).setUint16(20,3,true),
  b=>new DataView(b.buffer).setUint16(22,4,true),
  b=>new DataView(b.buffer).setUint16(34,24,true),
  b=>new DataView(b.buffer).setUint32(28,1234,true),
  b=>{b[36]=0x58},
 ];
 for(const mutate of mutations){const b=new Uint8Array(fixture);mutate(b);assert.equal(inspectPcmWav(b).valid,false);}
});
test('valid WAV with dishonest metadata duration is rejected',()=>{
 assert.equal(inspectPcmWav(sample(),400).valid,false);
 assert.equal(inspectPcmWav(sample(),NaN).valid,false);
});
test('a clipped, silent or oversized audio buffer is not a recording',()=>{
 const full=sample();const silent=new Uint8Array(full);silent.fill(0,44);
 assert.equal(inspectPcmWav(silent).valid,false);
 assert.equal(inspectPcmWav(full.subarray(0,80)).valid,false);
 assert.equal(inspectPcmWav(new Uint8Array(9*1024*1024)).valid,false);
});
