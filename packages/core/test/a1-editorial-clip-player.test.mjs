import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 A1EditorialClipPlayer,a1SixTurnAudioFormat,cueFingerprint,
 expandedA1GreetingPilots,expandedA1SituationalPilots
} from '../dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const scene=scenes[0];
const manifestFor=(s=scene)=>({
 format:a1SixTurnAudioFormat,sceneId:s.sceneId,status:'editorial-candidate',
 clips:s.turns.map(t=>({
  audioId:t.audioId,sourceFingerprint:cueFingerprint(t.text),
  bytes:22222,durationMs:850,sha256:'a'.repeat(64),accentTag:s.targetLanguage,
  rightsReference:'not-reviewed-original',sourceReference:'editorial-draft'
 }))
});
const native=reads=>({async checkOwnedClip(audioId){
 reads.push(audioId);
 return{bytes:22222,sha256:'a'.repeat(64),validPcmWav:true};
}});
const afterTurn=()=>new Promise(done=>setImmediate(done));

test('24 authored six-turn scenes admit only an internal candidate, not a public WAV player',()=>{
 assert.equal(scenes.length,24);
 assert.equal(scenes.flatMap(s=>s.turns).length,144);
 for(const s of scenes){
  assert.equal(manifestFor(s).clips.length,6);
  assert.equal(s.publicAvailable,false);
  assert.equal(s.rightsStatus,'pending-editorial-clearance');
 }
});

test('valid original clips require all six fresh checks on EACH manual playback',async()=>{
 const reads=[],starts=[],stops=[];
 let completed;
 const player=new A1EditorialClipPlayer(native(reads),{
  prepareForeground:async()=>{},
  createLocalClip:(id,rate)=>{starts.push([id,rate]);return{
   start(done){completed=done;},stop(){stops.push(id);}
  }; }
 });
 const first=player.play(scene.sceneId,scene.turns[2].audioId,manifestFor(),0.7);
 await afterTurn();
 assert.equal(reads.length,6);
 assert.equal(starts.length,1);
 assert.equal(starts[0][0],scene.turns[2].audioId);
 completed();
 assert.deepEqual(await first,{status:'completed',audioId:scene.turns[2].audioId});
 assert.equal(stops.length,1);
 const second=player.play(scene.sceneId,scene.turns[0].audioId,manifestFor(),0.9);
 await afterTurn();
 assert.equal(reads.length,12,'prior audit must not authorize another playback');
 assert.equal(starts.length,2);
 completed();
 assert.deepEqual(await second,{status:'completed',audioId:scene.turns[0].audioId});
});

test('invalid authoring, unrecognized ID or corrupt sibling blocks playback before native player',async()=>{
 let starts=0,reads=0,prepare=0;
 const player=new A1EditorialClipPlayer({
  async checkOwnedClip(id){
   reads++;return{bytes:22222,sha256:id===scene.turns[5].audioId?'f'.repeat(64):'a'.repeat(64),validPcmWav:true};
  }
 },{
  prepareForeground:async()=>{prepare++;},
  createLocalClip:()=>{starts++;return{start(){},stop(){}};}
 });
 const good=manifestFor();
 const bad={...good,clips:good.clips.map((c,i)=>i?c:{...c,sourceFingerprint:'forged'})};
 assert.deepEqual(await player.play(scene.sceneId,'../../private',good),{status:'unavailable'});
 assert.deepEqual(await player.play(scene.sceneId,good.clips[0].audioId,bad),{status:'unavailable'});
 assert.equal(reads,0);
 assert.equal(prepare,0);
 assert.deepEqual(await player.play(scene.sceneId,good.clips[0].audioId,good),{status:'unavailable'});
 assert.equal(reads,6);
 assert.equal(starts,0);
});

test('stop revokes an unresolved SHA/PCM check and never starts native audio',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 let starts=0;
 const player=new A1EditorialClipPlayer({
  async checkOwnedClip(){await gate;return{bytes:22222,sha256:'a'.repeat(64),validPcmWav:true};}
 },{
  prepareForeground:async()=>{},
  createLocalClip:()=>{starts++;return{start(){},stop(){}};}
 });
 const task=player.play(scene.sceneId,scene.turns[0].audioId,manifestFor());
 await afterTurn();
 player.stop();
 assert.deepEqual(await task,{status:'cancelled'});
 release();
 await afterTurn();
 assert.equal(starts,0);
});

test('new request replaces old audio; callbacks from previous player cannot give credit',async()=>{
 const callbacks=[],stops=[];
 const player=new A1EditorialClipPlayer(native([]),{
  prepareForeground:async()=>{},
  createLocalClip:id=>({
   start(done){callbacks.push(done);},stop(){stops.push(id);}
  })
 });
 const first=player.play(scene.sceneId,scene.turns[0].audioId,manifestFor());
 await afterTurn();
 const second=player.play(scene.sceneId,scene.turns[1].audioId,manifestFor());
 assert.deepEqual(await first,{status:'cancelled'});
 await afterTurn();
 callbacks[0]();
 callbacks[1]();
 assert.deepEqual(await second,{status:'completed',audioId:scene.turns[1].audioId});
 assert.equal(stops.length,2);
});

test('public screen cannot mount A1 private player, direct URLs, network or learner progress',()=>{
 const screen=readFileSync('mobile/A1EditorialPractice.tsx','utf8');
 const app=readFileSync('mobile/App.tsx','utf8');
 const bridge=readFileSync('mobile/a1-editorial-native-player.ts','utf8');
 const loader=readFileSync('mobile/a1-editorial-local-audio.ts','utf8');
 assert.match(screen,/loadA1LocalReviewManifest\(sceneId\)/);
 assert.match(screen,/localPlayer\.play\(sceneId,turn\.audioId,loaded\.manifest,rate\)/);
 assert.match(screen,/localPlayer\.stop\(\)/);
 assert.match(screen,/No se usará TTS como sustituto/);
 assert.match(app,/__DEV__ && <View/);
 assert.match(app,/editorialReviewOpen&&<A1EditorialPractice /);
 assert.match(bridge,/privateA1EditorialAudioUri\(audioId\)/);
 assert.match(bridge,/shouldPlayInBackground:false/);
 assert.match(loader,/auditA1SixTurnAudio\(sceneId,loaded\.manifest,a1NativeAudioVerifier\)/);
 assert.doesNotMatch(bridge,/https?:\/\//);
 assert.doesNotMatch(bridge,/fetch\(/);
});
