import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 a2B2EditorialRehearsalScenes,planA2B2EditorialVoiceRehearsal,
 firstReleaseLanguages,voiceLocales,planVoiceOutput,
 expandedFirstReleasePilots,expandedSecondEditorialPilots
} from '../dist/index.js';

test('18 A2–B2 scenes expose 108 manual system-voice editorial cues, no invented original WAV',()=>{
 assert.equal(a2B2EditorialRehearsalScenes.length,18);
 assert.deepEqual(a2B2EditorialRehearsalScenes.slice(0,9),expandedFirstReleasePilots);
 assert.deepEqual(a2B2EditorialRehearsalScenes.slice(9),expandedSecondEditorialPilots);
 const seen=new Set();
 for(const target of firstReleaseLanguages){
  const known=firstReleaseLanguages.find(x=>x!==target);
  for(const scene of a2B2EditorialRehearsalScenes.filter(s=>s.targetLanguage===target)){
   const plan=planA2B2EditorialVoiceRehearsal(known,target,scene.sceneId);
   assert.ok(plan,scene.sceneId);
   assert.equal(plan.publicAvailable,false);
   assert.equal(plan.canScore,false);
   assert.equal(plan.canCertify,false);
   assert.deepEqual(plan.checks,scene.checks);
   assert.equal(plan.noMicAlternative,scene.noMicAlternative);
   assert.equal(plan.spokenFollowUp,scene.spokenFollowUp);
   assert.equal(plan.turns.length,6);
   assert.deepEqual(plan.turns.map(t=>t.audioId),scene.turns.map(t=>t.audioId));
   for(const t of plan.turns){
    assert.equal(t.cue.source,'voicefirst-original');
    assert.equal(t.cue.kind,'dialogue-model-answer');
    assert.equal(t.cue.id,'a2-b2-editorial-only/'+t.audioId);
    assert.equal(t.cue.language,target);
    assert.equal(t.cue.locale,voiceLocales[target]);
    assert.equal(t.cue.text,scene.turns[t.index].text);
    assert.ok(!seen.has(t.cue.id));
    seen.add(t.cue.id);
    assert.equal(t.reviewerOnly,true);
    assert.equal(t.recordedAudioAvailable,false);
    assert.equal(t.offlineGuaranteed,false);
    assert.equal(t.canAssessListening,false);
    assert.equal(t.canRecordProgress,false);
    assert.equal(t.publicAvailable,false);
    const fakeOSVoice={identifier:'system-not-proven-offline',locale:voiceLocales[target],offlineVerified:false};
    const offline=planVoiceOutput({cue:t.cue,voices:[fakeOSVoice],requireOffline:true});
    assert.equal(offline.kind,'unavailable','TTS listing cannot certify airplane-mode availability');
   }
  }
 }
 assert.equal(seen.size,108);
});
test('editorial review refuses same-language, unsupported-language and cross-scene forgeries',()=>{
 assert.equal(planA2B2EditorialVoiceRehearsal('es','es','es/A2/housing-and-services'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('de','en-CA','en-CA/A2/plans-and-invitations'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('es','pt-BR','pt-BR/A2/housing-and-services'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('fr-CA','en-CA','fr-CA/A2/housing-and-services'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('fr-CA','en-CA','en-CA/A2/other-topic'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('fr-CA','en-CA','../../secrets'),null);
 assert.equal(planA2B2EditorialVoiceRehearsal('fr-CA','en-CA',null),null);
});
test('native screen remains DEV-only, foreground and TTS manual without microphone or score',()=>{
 const ui=readFileSync('mobile/A2B2EditorialPractice.tsx','utf8');
 const app=readFileSync('mobile/App.tsx','utf8');
 const course=readFileSync('packages/core/src/course.ts','utf8');
 assert.match(app,/\{__DEV__ && <View style=\{styles\.mission\}>/);
 assert.match(app,/\{editorialReviewOpen&&<A2B2EditorialPractice /);
 assert.match(ui,/if\(!__DEV__\)return null;/);
 assert.match(ui,/AppState\.addEventListener\('change'/);
 assert.match(ui,/next!=='active'/);
 assert.match(ui,/request\.current\+\+/);
 assert.match(ui,/void stopCuratedVoice\(\)/);
 assert.match(ui,/playCuratedVoice\(turn\.cue,rate,/);
 assert.match(ui,/Sin micrófono:/);
 assert.match(ui,/verbatimEvidence/);
 assert.doesNotMatch(ui,/fetch\(/);
 assert.doesNotMatch(ui,/\.recordAsync\(/);
 assert.doesNotMatch(ui,/SQLite/);
 assert.doesNotMatch(course,/a2B2EditorialRehearsalScenes/);
});
