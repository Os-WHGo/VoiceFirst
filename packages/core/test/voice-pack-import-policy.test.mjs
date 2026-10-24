import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightLocalWavPack,authoredVoiceCues,cueFingerprint} from '../dist/index.js';
const cue=authoredVoiceCues.find(c=>c.language==='en-CA');
const entry={cueId:cue.id,fingerprint:cueFingerprint(cue.text),language:'en-CA',locale:'en-CA',
 path:'clips/0123456789abcdef.wav',format:'wav',sha256:'a'.repeat(64),bytes:8000,durationMs:250,
 license:'voicefirst-original',rightsOwner:'VoiceFirst Authors',rightsReference:'written-001',reviewer:'Reviewed by editor'};
const sample=()=>({schema:1,id:'voicefirst-en-CA-v1',language:'en-CA',locale:'en-CA',complete:false,recordings:[entry]});
test('WAV pack can be partially installed with rights and predictable clip paths',()=>{
 const x=preflightLocalWavPack(sample());assert.equal(x.valid,true);
 if(x.valid){assert.equal(x.totalBytes,8000);assert.equal(x.recordings.length,1);assert.ok(x.missing>0);}
});
test('import policy rejects attempts to shadow manifest or files outside clips directory',()=>{
 for(const path of ['pack.json','clips/../other.wav','evil.wav','clips/x.mp3','clips/.hidden.wav','clips/too..long.wav','clips/a/b.wav']){
  assert.equal(preflightLocalWavPack({...sample(),recordings:[{...entry,path,format:path.endsWith('.mp3')?'mp3':'wav'}]}).valid,false,path);
 }
});
test('import policy rejects misidentified pack, foreign locale and forged legal metadata',()=>{
 assert.equal(preflightLocalWavPack({...sample(),id:'pretend-voicefirst'}).valid,false);
 assert.equal(preflightLocalWavPack({...sample(),locale:'en-US'}).valid,false);
 assert.equal(preflightLocalWavPack({...sample(),recordings:[{...entry,rightsReference:''}]}).valid,false);
});
