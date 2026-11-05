import test from 'node:test';
import assert from 'node:assert/strict';
import {AdvancedEditorialClipPlayer,startAdvancedRehearsal,advancedListeningStoryboards} from '../dist/index.js';
const s=advancedListeningStoryboards[0];
const state=startAdvancedRehearsal('fr-CA',s.targetLanguage,s.level,s.unitId);
const clips=s.turns.map((turn,i)=>({audioId:turn.audioId,sceneId:s.sceneId,localUri:'file:///review/clip'+i+'.wav',bytes:100+i,sha256:'a'.repeat(64),accentTag:s.targetLanguage,rightsReference:'editorial-only',sourceReference:'internal-review'}));
test('missing six files never start editorial playback',async()=>{
 let played=0;
 const player=new AdvancedEditorialClipPlayer({fileSizeBytes:async()=>0,sha256File:async()=>''},{prepareForeground:async()=>{},createLocalClip:()=>{played++;return{start(){},stop(){}};}});
 assert.deepEqual(await player.play(state,[]),{status:'unavailable'});
 assert.deepEqual(await player.play(state,clips.slice(0,5)),{status:'unavailable'});
 assert.equal(played,0);
});

test('verified six-file local review completes without storing progress',async()=>{
 let count=0,done;
 const native={fileSizeBytes:async uri=>{count++;return clips.find(x=>x.localUri===uri)?.bytes??0;},sha256File:async()=>{count++;return 'a'.repeat(64);}};
 const port={prepareForeground:async()=>{},createLocalClip:()=>({start(callback){done=callback;},stop(){}})};
 const player=new AdvancedEditorialClipPlayer(native,port);
 const task=player.play(state,clips);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(count,12);
 assert.equal(typeof done,'function');
 done();
 assert.deepEqual(await task,{status:'completed',audioId:clips[0].audioId});
 assert.equal(state.recordedProgress,false);
});

test('rejected hash, oversized assets and malformed IDs cannot play',async()=>{
 let starts=0;
 const player=new AdvancedEditorialClipPlayer(
  {fileSizeBytes:async uri=>clips.find(x=>x.localUri===uri)?.bytes??0,sha256File:async()=>('a'.repeat(64))},
  {prepareForeground:async()=>{},createLocalClip:()=>{starts++;return{start(){},stop(){}};}}
 );
 const corrupt=clips.map((c,i)=>i?c:{...c,sha256:'f'.repeat(64)});
 const oversized=clips.map((c,i)=>i?c:{...c,bytes:9*1024*1024});
 const duplicated=[clips[0],clips[0],...clips.slice(2)];
 for(const input of [corrupt,oversized,duplicated]){
  assert.deepEqual(await player.play(state,input),{status:'unavailable'});
 }
 assert.equal(starts,0);
});

test('stop revokes verification while file read is unresolved',async()=>{
 let release;
 const blocked=new Promise(done=>{release=()=>done(100);});
 let started=0;
 const player=new AdvancedEditorialClipPlayer(
  {fileSizeBytes:async()=>blocked,sha256File:async()=>('a'.repeat(64))},
  {prepareForeground:async()=>{},createLocalClip:()=>{started++;return{start(){},stop(){}};}}
 );
 const pending=player.play(state,clips);
 await new Promise(resolve=>setImmediate(resolve));
 player.stop();
 assert.deepEqual(await pending,{status:'cancelled'});
 release();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(started,0);
});

test('new playback cancels stale requests and ignored callbacks',async()=>{
 let callbacks=[],stops=0;
 const player=new AdvancedEditorialClipPlayer(
  {fileSizeBytes:async uri=>clips.find(c=>c.localUri===uri)?.bytes??0,sha256File:async()=>('a'.repeat(64))},
  {prepareForeground:async()=>{},createLocalClip:()=>({
    start(done){callbacks.push(done);},stop(){stops++;}
  })}
 );
 const first=player.play(state,clips);
 await new Promise(resolve=>setImmediate(resolve));
 const second=player.play(state,clips);
 assert.deepEqual(await first,{status:'cancelled'});
 await new Promise(resolve=>setImmediate(resolve));
 callbacks[0]();
 assert.equal(stops,1);
 callbacks[1]();
 assert.deepEqual(await second,{status:'completed',audioId:clips[0].audioId});
 assert.equal(stops,2);
});
