import test from 'node:test';
import assert from 'node:assert/strict';
import {
 advancedListeningStoryboards,advancedStoryboardExpectedAudioIds,
 advancedStoryboardTopics,firstReleaseLanguagePairs,
 auditAdvancedSceneLocalAudio,startAdvancedRehearsal,
 advancedRehearsalCurrent,advanceAdvancedRehearsal,
 advancedEditorialAudioRequest,lessonsFor
} from '../dist/index.js';

const hex='c'.repeat(64);
const target=advancedListeningStoryboards[0];
function candidate(turn,index){
 return {
  audioId:turn.audioId,sceneId:target.sceneId,
  localUri:'file:///voicefirst/advanced/clip-'+index+'.wav',
  bytes:100+index,sha256:hex,accentTag:target.targetLanguage,
  rightsReference:'source-document-pending-review',
  sourceReference:'original-recording-editorial-candidate'
 };
}
const rows=target.turns.map(candidate);
const verifier={
 fileSizeBytes:async uri=>{
  const index=rows.findIndex(row=>row.localUri===uri);
  if(index<0)throw Error('missing');
  return rows[index].bytes;
 },
 sha256File:async uri=>uri.startsWith('file:///')?hex:'bad'
};
test('advanced audio audit defaults to 72 missing assets; metadata alone cannot permit public use',async()=>{
 const result=await auditAdvancedSceneLocalAudio([],verifier);
 assert.equal(result.expected,72);
 assert.equal(result.verified,0);
 assert.equal(result.missing.length,72);
 assert.equal(result.scenes.length,12);
 assert.ok(result.scenes.every(s=>s.verifiedTurns===0&&!s.editorialAudioRehearsalReady));
 assert.equal(result.readyForPublicRelease,false);
 assert.equal(advancedStoryboardExpectedAudioIds.length,72);
});

test('six actual verified local files unlock one *editorial* audio rehearsal only',async()=>{
 let reads=0;
 const files={
  fileSizeBytes:async uri=>{reads++;return verifier.fileSizeBytes(uri);},
  sha256File:async uri=>{reads++;return verifier.sha256File(uri);}
 };
 const result=await auditAdvancedSceneLocalAudio(rows,files);
 assert.equal(reads,12,'verify size and SHA from injected native port per clip');
 assert.equal(result.expected,72);
 assert.equal(result.verified,6);
 assert.equal(result.missing.length,66);
 assert.equal(result.rejected.length,0);
 assert.equal(result.scenes.filter(s=>s.editorialAudioRehearsalReady).length,1);
 assert.equal(result.scenes.find(s=>s.sceneId===target.sceneId)?.verifiedTurns,6);
 assert.equal(result.readyForPublicRelease,false);
 const s=startAdvancedRehearsal('fr-CA',target.targetLanguage,target.level,target.unitId);
 assert.ok(s);
 assert.deepEqual(advancedEditorialAudioRequest(s,null),{status:'unavailable'});
 assert.deepEqual(advancedEditorialAudioRequest(s,result),{
  status:'verified-editorial-asset',audioId:target.turns[0].audioId
 });
 const moved=advanceAdvancedRehearsal(s,'next');
 assert.deepEqual(advancedEditorialAudioRequest(moved,result),{
  status:'verified-editorial-asset',audioId:target.turns[1].audioId
 });
 const check=advanceAdvancedRehearsal(moved,'next');
 assert.equal(advancedRehearsalCurrent(check).kind,'evidence-question');
 assert.deepEqual(advancedEditorialAudioRequest(check,result),{status:'unavailable'});
 const other=advancedListeningStoryboards.find(x=>x.targetLanguage===target.targetLanguage&&x.sceneId!==target.sceneId);
 assert.ok(other);
 const notReady=startAdvancedRehearsal('fr-CA',other.targetLanguage,other.level,other.unitId);
 assert.deepEqual(advancedEditorialAudioRequest(notReady,result),{status:'unavailable'});
});

test('malformed, repeated, oversized or remote audio manifests fail before native access',async()=>{
 let calls=0;
 const watch={fileSizeBytes:async()=>{calls++;return 123;},sha256File:async()=>{calls++;return hex;}};
 const bad=[
  null,
  Array(73).fill(null),
  [...rows,{...rows[0]}],
  [{...rows[0],localUri:'https://example.com/clip.wav'}],
  [{...rows[0],localUri:'file:///voicefirst/../clip.wav'}],
  [{...rows[0],localUri:'file:////voicefirst/clip.wav'}],
  [{...rows[0],localUri:'file:///voicefirst//clip.wav'}],
  [{...rows[0],localUri:'file:///voicefirst/%2e%2e/clip.wav'}],
  [{...rows[0],localUri:'file:///voicefirst/audio.wav?token=x'}],
  [{...rows[0],bytes:40*1024*1024}],
  [{...rows[0],sha256:'not-a-digest'}],
  [{...rows[0],accentTag:'it'}],
  [{...rows[0],sceneId:'es/C2/not-real'}],
  [rows[0],{...rows[1],localUri:rows[0].localUri}]
 ];
 for(const inventory of bad){
  const outcome=await auditAdvancedSceneLocalAudio(inventory,watch);
  assert.equal(outcome.verified,0);
  assert.equal(outcome.missing.length,72);
  assert.ok(outcome.rejected.length>0);
  assert.equal(outcome.scenes.some(s=>s.editorialAudioRehearsalReady),false);
 }
 assert.equal(calls,0,'do not hash any file when preflight fails');
});

test('I/O errors, wrong size and SHA mismatches are rejected and cannot ready a scene',async()=>{
 const cases=[
  {fileSizeBytes:async()=>99,sha256File:async()=>hex,reason:'size-mismatch'},
  {fileSizeBytes:async()=>100,sha256File:async()=>('a'.repeat(64)),reason:'checksum-mismatch'},
  {fileSizeBytes:async()=>{throw Error('disk offline');},sha256File:async()=>hex,reason:'native-verification-failed'}
 ];
 for(const {fileSizeBytes,sha256File,reason} of cases){
  const result=await auditAdvancedSceneLocalAudio([rows[0]],{fileSizeBytes,sha256File});
  assert.equal(result.verified,0);
  assert.ok(result.rejected.some(x=>x.reason===reason));
  assert.equal(result.readyForPublicRelease,false);
 }
 const partial=await auditAdvancedSceneLocalAudio(rows.slice(0,5),verifier);
 assert.equal(partial.verified,5);
 assert.equal(partial.scenes.some(x=>x.editorialAudioRehearsalReady),false);
});

test('24 directed C1/C2 script paths provide ten non-scoring offline editorial steps',()=>{
 let rehearsals=0;
 for(const {known,target:learning} of firstReleaseLanguagePairs){
  for(const level of ['C1','C2']){
   for(const unitId of advancedStoryboardTopics[level]){
    const start=startAdvancedRehearsal(known,learning,level,unitId);
    assert.ok(start);
    assert.equal(start.recordedProgress,false);
    let state=start;
    let seenTurns=0,seenChecks=0,seenFollowups=0;
    for(let i=0;i<10;i++){
     const step=advancedRehearsalCurrent(state);
     assert.ok(step);
     assert.equal(step.index,i);
     assert.equal(step.total,10);
     if(step.kind==='script-turn'){
      seenTurns++;
      assert.equal(step.verifiedLocalAudioRequest,false);
      assert.ok(step.audioId.includes('/turn-'));
     }else if(step.kind==='evidence-question'){
      seenChecks++;
      assert.equal(step.evidenceRevealed,false);
      assert.equal(step.evidence,undefined);
      state=advanceAdvancedRehearsal(state,'reveal');
      const revealed=advancedRehearsalCurrent(state);
      assert.equal(revealed.evidenceRevealed,true);
      assert.ok(revealed.evidence.length>=10);
      assert.ok(revealed.supportedInterpretation.length>=40);
      assert.ok(revealed.unsupportedInterpretation.length>=40);
     }else if(step.kind==='follow-up'){
      seenFollowups++;
      assert.ok(step.spokenPrompt.length>35);
      assert.ok(step.withoutMicrophone.length>35);
     }else assert.fail('Unexpected completion while steps remain');
     state=advanceAdvancedRehearsal(state,'next');
    }
    assert.deepEqual([seenTurns,seenChecks,seenFollowups],[6,3,1]);
    assert.equal(state.cursor,10);
    assert.equal(state.recordedProgress,false);
    assert.deepEqual(advancedRehearsalCurrent(state),{
     kind:'complete',id:'complete',index:10,total:10,recordedProgress:false,certification:false
    });
    const restarted=advanceAdvancedRehearsal(state,'restart');
    assert.equal(restarted.cursor,0);
    const stopped=advanceAdvancedRehearsal(restarted,'stop');
    assert.equal(stopped.closed,true);
    assert.equal(advancedRehearsalCurrent(stopped).kind,'complete');
    rehearsals++;
   }
  }
 }
 assert.equal(rehearsals,24);
 for(const locale of ['en-CA','es','fr-CA'])assert.equal(lessonsFor(locale).length,14);
});

test('editorial controller rejects invalid routes, malformed state and forged audio readiness',async()=>{
 assert.equal(startAdvancedRehearsal('es','es','C1','nuance-and-register'),null);
 assert.equal(startAdvancedRehearsal('pt-BR','en-CA','C1','nuance-and-register'),null);
 assert.equal(startAdvancedRehearsal('en-CA','fr-CA','A1','nuance-and-register'),null);
 assert.equal(startAdvancedRehearsal('en-CA','fr-CA','C2','nuance-and-register'),null);
 assert.equal(advancedRehearsalCurrent(null),null);
 assert.equal(advanceAdvancedRehearsal({cursor:5},'next'),null);
 const state=startAdvancedRehearsal('fr-CA','en-CA','C1','nuance-and-register');
 assert.ok(state);
 assert.equal(advanceAdvancedRehearsal(state,'other'),null);
 assert.equal(advancedRehearsalCurrent({...state,recordedProgress:true}),null);
 assert.equal(advancedRehearsalCurrent({...state,cursor:100}),null);
 const audit=await auditAdvancedSceneLocalAudio(rows,verifier);
 const forged={...audit,verified:7};
 assert.deepEqual(advancedEditorialAudioRequest(state,forged),{status:'unavailable'});
 const forged2={...audit,verifiedIds:[...audit.verifiedIds,rows[0].audioId]};
 assert.deepEqual(advancedEditorialAudioRequest(state,forged2),{status:'unavailable'});
});
