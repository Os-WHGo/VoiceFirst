import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 a1SixTurnAudioFormat,inspectA1SixTurnAudioManifest,auditA1SixTurnAudio,
 expandedA1GreetingPilots,expandedA1SituationalPilots,cueFingerprint
} from '../dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const manifestFor=scene=>({
 format:a1SixTurnAudioFormat,sceneId:scene.sceneId,status:'editorial-candidate',
 clips:scene.turns.map(turn=>({
  audioId:turn.audioId,sourceFingerprint:cueFingerprint(turn.text),
  bytes:12345,durationMs:1200,sha256:'a'.repeat(64),
  accentTag:scene.targetLanguage,rightsReference:'review-pending',
  sourceReference:'original-voice-review'
 }))
});
test('exactly 24 source-locked A1 six-turn manifests are candidates, never approved',()=>{
 assert.equal(scenes.length,24);
 const all=new Set();
 for(const scene of scenes){
  const manifest=manifestFor(scene);
  const checked=inspectA1SixTurnAudioManifest(scene.sceneId,manifest);
  assert.equal(checked.kind,'candidate',scene.sceneId);
  assert.equal(checked.audioVerified,false);
  assert.equal(checked.rightsCleared,false);
  assert.equal(checked.publicAvailable,false);
  assert.deepEqual(checked.clips.map(c=>c.audioId),scene.turns.map(t=>t.audioId));
  for(const entry of checked.clips){
   assert.ok(!all.has(entry.audioId));
   all.add(entry.audioId);
  }
 }
 assert.equal(all.size,144);
});

test('A1 strict six-turn manifest refuses forged approval, missing IDs, bad source and dangerous metadata before disk',async()=>{
 const scene=scenes[0],good=manifestFor(scene),clips=good.clips;
 const cases=[
  {...good,status:'approved'},
  {...good,publicAvailable:true},
  {...good,sceneId:'en-CA/A1/unknown'},
  {...good,clips:clips.slice(0,5)},
  {...good,clips:[clips[0],clips[0],...clips.slice(2)]},
  {...good,clips:clips.map((c,i)=>i?c:{...c,audioId:'../../private'})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,sourceFingerprint:'wrong'})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,sha256:'no'})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,bytes:9*1024*1024})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,durationMs:61000})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,accentTag:'it'})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,rightsReference:''})},
  {...good,clips:clips.map((c,i)=>i?c:{...c,localUri:'https://example.org/a.wav'})}
 ];
 let inspected=0;
 const port={async checkOwnedClip(){inspected++;throw Error('should not read');}};
 for(const item of cases){
  assert.equal(inspectA1SixTurnAudioManifest(scene.sceneId,item).kind,'rejected');
  const result=await auditA1SixTurnAudio(scene.sceneId,item,port);
  assert.equal(result.verified,0);
  assert.equal(result.readyForEditorialPlayback,false);
  assert.equal(result.publicAvailable,false);
  assert.equal(result.rightsCleared,false);
 }
 assert.equal(inspected,0);
 assert.equal(inspectA1SixTurnAudioManifest('en-CA/A1/unknown',good).kind,'rejected');
});

test('real injected byte/PCM validation is required for every A1 clip',async()=>{
 const scene=scenes[5],good=manifestFor(scene);
 let reads=0;
 const verifier={async checkOwnedClip(id,duration){
  reads++;
  assert.equal(duration,1200);
  assert.ok(good.clips.some(c=>c.audioId===id));
  return {bytes:12345,sha256:'a'.repeat(64),validPcmWav:true};
 }};
 const success=await auditA1SixTurnAudio(scene.sceneId,good,verifier);
 assert.equal(reads,6);
 assert.equal(success.verified,6);
 assert.equal(success.readyForEditorialPlayback,true);
 assert.equal(success.rightsCleared,false);
 assert.equal(success.publicAvailable,false);
 assert.equal(success.proofPersistent,false);
 for(const variant of [
  {bytes:12344,sha256:'a'.repeat(64),validPcmWav:true},
  {bytes:12345,sha256:'b'.repeat(64),validPcmWav:true},
  {bytes:12345,sha256:'a'.repeat(64),validPcmWav:false},
 ]){
  const report=await auditA1SixTurnAudio(scene.sceneId,good,{
   async checkOwnedClip(id){
    return id===good.clips[0].audioId?variant:
     {bytes:12345,sha256:'a'.repeat(64),validPcmWav:true};
   }
  });
  assert.equal(report.verified,5);
  assert.equal(report.readyForEditorialPlayback,false);
  assert.equal(report.rejected.length,1);
 }
 const failed=await auditA1SixTurnAudio(scene.sceneId,good,{checkOwnedClip:async()=>{throw Error('file changed');}});
 assert.equal(failed.verified,0);
 assert.equal(failed.rejected.length,6);
 assert.equal(failed.readyForEditorialPlayback,false);
});

test('A1 mobile file inspection remains private, explicit and separate from public packs',()=>{
 const native=readFileSync('mobile/a1-editorial-local-audio.ts','utf8');
 const review=readFileSync('mobile/A1EditorialPractice.tsx','utf8');
 const app=readFileSync('mobile/App.tsx','utf8');
 assert.match(native,/voicefirst-a1-review/);
 assert.match(native,/Paths\.document/);
 assert.match(native,/inspectPcmWav\(bytes,durationMs\)\.valid/);
 assert.match(native,/sha256Bytes\(bytes\)/);
 assert.match(native,/auditA1SixTurnAudio/);
 assert.match(review,/onPress=\{\(\)=>\{\s*stopAudio\(\);\s*const token=/);
 assert.match(review,/reviewA1LocalAudio\(transcript\.sceneId\)/);
 assert.match(review,/request\.current===token/);
 assert.ok(app.includes('{__DEV__ && <View style={styles.mission}>'));
 assert.ok(!app.includes('reviewA1LocalAudio('));
 assert.ok(!native.includes('https://'));
});
