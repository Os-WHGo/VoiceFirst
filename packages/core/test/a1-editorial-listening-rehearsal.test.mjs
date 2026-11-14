import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 firstReleaseLanguages,a1EditorialSceneTopics,startA1EditorialReview,
 submitA1EditorialReview,advanceA1EditorialReview,a1EditorialListeningTurns,
 a1EditorialReviewTranscript,voiceLocales,planVoiceOutput,
 expandedA1GreetingPilots,expandedA1SituationalPilots
} from '../dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
test('24 private A1 scenes have 144 authored one-turn speech prompts, never recorded or scored',()=>{
 assert.equal(scenes.length,24);
 assert.equal(a1EditorialSceneTopics.length,8);
 const ids=new Set();
 for(const target of firstReleaseLanguages){
  const known=target==='en-CA'?'fr-CA':'en-CA';
  for(const topic of a1EditorialSceneTopics){
   const state=startA1EditorialReview(known,target,topic);
   assert.ok(state);
   const transcript=a1EditorialReviewTranscript(state);
   const planned=a1EditorialListeningTurns(state);
   assert.equal(planned.length,6);
   assert.deepEqual(planned.map(t=>t.audioId),transcript.turns.map(t=>t.audioId));
   for(const turn of planned){
    assert.equal(turn.cue.id,'a1-editorial-only/'+turn.audioId);
    assert.ok(!ids.has(turn.cue.id));
    ids.add(turn.cue.id);
    assert.equal(turn.cue.language,target);
    assert.equal(turn.cue.locale,voiceLocales[target]);
    assert.equal(turn.cue.source,'voicefirst-original');
    assert.equal(turn.cue.kind,'dialogue-model-answer');
    assert.equal(turn.cue.text,transcript.turns[turn.index].text);
    assert.equal(turn.reviewerOnly,true);
    assert.equal(turn.recordedAudioAvailable,false);
    assert.equal(turn.offlineGuaranteed,false);
    assert.equal(turn.canAssessListening,false);
    assert.equal(turn.canRecordProgress,false);
    assert.equal(turn.publicAvailable,false);
    const offline=planVoiceOutput({cue:turn.cue,
     voices:[{identifier:'system-voice',locale:voiceLocales[target],offlineVerified:false}],
     requireOffline:true});
    assert.equal(offline.kind,'unavailable','system voice without proof cannot claim offline');
   }
  }
 }
 assert.equal(ids.size,144);
});

test('reviewer speech plan rejects forged and closed states and never changes progress',()=>{
 const state=startA1EditorialReview('es','en-CA','food-and-shopping');
 assert.equal(a1EditorialListeningTurns({...state,publicAvailable:true}),null);
 assert.equal(a1EditorialListeningTurns({...state,recordedProgress:true}),null);
 assert.equal(a1EditorialListeningTurns({...state,canScore:true}),null);
 assert.equal(a1EditorialListeningTurns({...state,knownLanguage:'en-CA'}),null);
 assert.equal(a1EditorialListeningTurns({...state,sceneId:'fr-CA/A1/food-and-shopping'}),null);
 assert.equal(a1EditorialListeningTurns(null),null);
 const before=a1EditorialListeningTurns(state);
 const answer=submitA1EditorialReview(state,{kind:'choice',optionId:'supported'});
 const after=a1EditorialListeningTurns(answer.state);
 assert.deepEqual(after,before);
 assert.equal(answer.countsAsMastery,false);
 assert.equal(answer.recordedProgress,false);
 const stopped=advanceA1EditorialReview(state,'stop');
 assert.equal(a1EditorialListeningTurns(stopped),null);
 assert.equal(a1EditorialListeningTurns({...state,cursor:3}),null);
});

test('A1 editorial system voice is manual, cancellable, foreground-only and behind DEV gate',()=>{
 const screen=readFileSync('mobile/A1EditorialPractice.tsx','utf8');
 const app=readFileSync('mobile/App.tsx','utf8');
 assert.match(screen,/AppState\.addEventListener\('change'/);
 assert.match(screen,/next!=='active'/);
 assert.match(screen,/stopCuratedVoice\(\)/);
 assert.match(screen,/return\(\)=>\{request\.current\+\+;importRequest\.current\+\+;localPlayer\.stop\(\);void stopCuratedVoice\(\);\}/);
 assert.match(screen,/onPress=\{\(\)=>playTurn\(listening\[i\]!\)\}/);
 assert.match(screen,/playCuratedVoice\(turn\.cue,rate/);
 assert.match(screen,/offline ni calidad de voz/);
 assert.ok(screen.indexOf('playCuratedVoice(turn.cue,rate')>screen.indexOf('const playTurn='));
 assert.ok(app.includes('{__DEV__ && <View style={styles.mission}>'));
 assert.ok(app.includes('<A1EditorialPractice known={nativeLanguage} target={target} rate={rate}/>'));
 assert.ok(!app.includes('a1EditorialListeningTurns('));
});
