import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 firstReleaseLanguages,expandedFirstReleasePilots,
 expandedSecondEditorialPilots,expandedSecondExpectedAudioIds,
 auditExpandedSecondEditorialPilots,
 a2EditorialDrafts,b1EditorialDrafts,b2EditorialDrafts
} from '../dist/index.js';

const first=new Set(expandedFirstReleasePilots.map(s=>s.sceneId));
const source=[...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts];
const original=id=>source.find(s=>[s.targetLanguage,s.level,s.unitId].join('/')===id);

test('new A2–B2 pilots cover nine additional source-locked scenes, 54 distinct future audio IDs',()=>{
 const result=auditExpandedSecondEditorialPilots();
 assert.deepEqual(result,{valid:true,errors:[],scenes:9,turns:54,checks:27,
  availableToLearners:false,verifiedAudio:0});
 assert.equal(expandedSecondEditorialPilots.length,9);
 assert.equal(expandedSecondExpectedAudioIds.length,54);
 assert.equal(new Set(expandedSecondExpectedAudioIds).size,54);
 const seen=new Set();
 for(const s of expandedSecondEditorialPilots){
  assert.ok(!first.has(s.sceneId),'prior original pilot must remain untouched');
  assert.ok(!seen.has(s.sceneId));
  seen.add(s.sceneId);
  assert.equal(s.turns.length,6);
  assert.equal(s.checks.length,3);
  assert.equal(s.publicAvailable,false);
  assert.equal(s.canCertify,false);
  assert.equal(s.canScore,false);
  assert.equal(s.audioStatus,'not-recorded');
  assert.equal(s.editorialStatus,'not-human-reviewed');
  assert.equal(s.rightsStatus,'pending-editorial-clearance');
  assert.equal(s.spokenFollowUp.length>=55,true);
  assert.equal(s.noMicAlternative.length>=55,true);
  assert.deepEqual(s.turns.slice(0,2).map(t=>t.text),original(s.sceneId).dialogue,
   'preserve the two lines already authored in the existing editor');
  for(const [i,question] of s.checks.entries()){
   assert.equal(question.afterTurnId,'turn-'+(2*i+2));
   assert.ok(s.turns[2*i+1].text.includes(question.verbatimEvidence),
    'question evidence MUST be a direct substring of the preceding reply');
  }
 }
 for(const language of firstReleaseLanguages){
  const list=expandedSecondEditorialPilots.filter(s=>s.targetLanguage===language);
  assert.deepEqual(list.map(s=>s.level),['A2','B1','B2']);
  assert.deepEqual(list.map(s=>s.unitId),
   ['housing-and-services','handling-unexpected-situations','complex-instructions']);
 }
});

test('single altered original, forged answer evidence or premature publication is rejected',()=>{
 const changes=[
  s=>{s[0].turns[0].text='An invented original line';},
  s=>{s[0].turns[5].audioId='https://remote.example/unsafe.wav';},
  s=>{s[0].turns[2].audioId=s[0].turns[0].audioId;},
  s=>{s[0].turns.pop();},
  s=>{s[0].checks[1].verbatimEvidence='unheard invented response';},
  s=>{s[0].checks[0].afterTurnId='turn-5';},
  s=>{s[0].checks[2].unsupportedInterpretation='';},
  s=>{s[0].publicAvailable=true;},
  s=>{s[0].canScore=true;},
  s=>{s[0].canCertify=true;},
  s=>{s[0].audioStatus='recorded';},
  s=>{s[0].rightsStatus='cleared';},
  s=>{s[0].editorialStatus='reviewed';},
  s=>{s[0].spokenFollowUp='Answer';},
  s=>{s[0].noMicAlternative='';},
  s=>{s[0].sceneId='en-CA/A2/unknown-topic';},
  s=>{s[0].sceneId=s[1].sceneId;},
 ];
 for(const mutate of changes){
  const sample=structuredClone(expandedSecondEditorialPilots);
  mutate(sample);
  const result=auditExpandedSecondEditorialPilots(sample);
  assert.equal(result.valid,false,'must reject any invalid authoring or rights tampering');
  assert.ok(result.errors.length);
  assert.equal(result.availableToLearners,false);
  assert.equal(result.verifiedAudio,0);
 }
 const missing=structuredClone(expandedSecondEditorialPilots).slice(0,8);
 assert.equal(auditExpandedSecondEditorialPilots(missing).valid,false);
 assert.equal(auditExpandedSecondEditorialPilots(null).valid,false);
});

test('new situations do not register audio, score or secretly appear in mandatory course',()=>{
 const app=readFileSync('mobile/App.tsx','utf8');
 const course=readFileSync('packages/core/src/course.ts','utf8');
 const progress=readFileSync('mobile/progress-storage.ts','utf8');
 for(const file of [app,course,progress]){
  assert.doesNotMatch(file,/expandedSecondEditorialPilots/);
  assert.doesNotMatch(file,/expandedSecondExpectedAudioIds/);
 }
 for(const s of expandedSecondEditorialPilots){
  for(const t of s.turns){
   assert.ok(t.audioId.startsWith(s.targetLanguage+'/'+s.level.toLowerCase()+'/'+s.unitId+'/turn-'));
   assert.ok(!t.audioId.includes('http:'));
  }
 }
});
