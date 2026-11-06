import test from 'node:test';
import assert from 'node:assert/strict';
import {
 firstReleaseLanguages,curriculumUnitBlueprint,
 expandedA1GreetingPilots,expandedA1SituationalPilots,
 a1ExpandedExpectedAudioIds,a1SituationalAudioIds,
 auditExpandedA1SituationalPilots,auditExpandedA1GreetingPilots,
 firstReleaseEditorialPackages,auditFirstReleaseProductionPackages,
 editorialPackagePreview,lessonsFor
} from '../dist/index.js';

const launchA1=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];

test('every one of eight A1 topic families has a six-turn draft for each first-release target',()=>{
 const expected=curriculumUnitBlueprint.A1;
 assert.equal(expected.length,8);
 assert.equal(launchA1.length,24);
 assert.equal(expandedA1SituationalPilots.length,21);
 assert.equal(auditExpandedA1SituationalPilots().valid,true);
 assert.equal(auditExpandedA1GreetingPilots().valid,true);
 for(const target of firstReleaseLanguages){
  const units=launchA1.filter(s=>s.targetLanguage===target);
  assert.equal(units.length,8);
  assert.deepEqual(new Set(units.map(s=>s.unitId)),new Set(expected));
  for(const unitId of expected){
   const scene=units.find(s=>s.unitId===unitId);
   assert.ok(scene, target+'/'+unitId);
   assert.equal(scene.turns.length,6);
   assert.equal(scene.checks.length,3);
   assert.equal(scene.publicAvailable,false);
   assert.equal(scene.audioStatus,'not-recorded');
   assert.equal(scene.canScore,false);
   assert.equal(scene.canCertify,false);
   const preview=editorialPackagePreview(target,'A1',unitId);
   assert.ok(preview);
   assert.equal(preview.lesson.activities.length,14);
   assert.equal(preview.publicAvailable,false);
   assert.equal(preview.hasApprovedAudio,false);
   assert.equal(preview.canAwardProgress,false);
   assert.equal(preview.canAssess,false);
  }
  assert.equal(lessonsFor(target).length,14,
   'draft content must remain outside historical learner sessions');
 }
});

test('A1 expanded scripts plan 144 unique audio IDs but claim zero real recordings',()=>{
 const ids=[...a1ExpandedExpectedAudioIds,...a1SituationalAudioIds];
 assert.equal(ids.length,144);
 assert.equal(new Set(ids).size,144);
 assert.ok(ids.every(id=>/^((en-CA)|(fr-CA)|(es))\/a1\/[a-z-]+\/turn-[1-6]$/.test(id)));
 const report=auditFirstReleaseProductionPackages();
 assert.equal(report.structurallyValid,true,report.errors.join('; '));
 assert.equal(report.candidateLessons,144);
 assert.equal(report.draftActivities,1347);
 assert.equal(report.verifiedVoiceClips,0);
 assert.equal(report.editoriallyApprovedLessons,0);
 assert.equal(report.publiclyAvailableLessons,0);
 assert.equal(report.fullCoursesReady,0);
 assert.equal(firstReleaseEditorialPackages.length,3);
});

test('new A1 scenes provide 12 non-mic and mediation prompts and literal evidence',()=>{
 const newTopics=[
  'numbers-time-and-dates','family-and-people',
  'daily-routines','basic-needs-and-help'
 ];
 const scenes=expandedA1SituationalPilots.filter(s=>newTopics.includes(s.unitId));
 assert.equal(scenes.length,12);
 for(const scene of scenes){
  assert.ok(scene.spokenFollowUp.trim().length>=65);
  assert.ok(scene.noMicAlternative.trim().length>=65);
  assert.ok(scene.mediationPrompt.trim().length>=65);
  const preview=editorialPackagePreview(scene.targetLanguage,'A1',scene.unitId);
  assert.ok(preview);
  assert.equal(preview.lesson.activities.filter(a=>a.kind==='listen').length,6);
  assert.equal(preview.lesson.activities.filter(a=>a.kind==='choice').length,4);
  for(const [i,check] of scene.checks.entries()){
   assert.ok(scene.turns[i*2+1].text.includes(check.verbatimEvidence));
   assert.ok(preview.lesson.activities.some(a=>a.kind==='choice'&&
    a.prompt.target===check.question&&
    a.options.some(o=>o.id===a.correctOptionId&&o.text===check.verbatimEvidence)&&
    a.options.some(o=>o.text===check.unsupportedInterpretation)));
  }
 }
});

test('falsified content and missing final A1 topic are rejected as unreleasable',()=>{
 const source=expandedA1SituationalPilots;
 const last=source.length-1;
 const changed=[...source.slice(0,last),{
  ...source[last],checks:source[last].checks.map((c,i)=>
   i===2?{...c,verbatimEvidence:'Not present in the speaker reply'}:c)
 }];
 const bad=auditExpandedA1SituationalPilots(changed);
 assert.equal(bad.valid,false);
 assert.ok(bad.errors.some(e=>e.startsWith('UNGROUNDED_A1_CHECK')));
 const cut=auditExpandedA1SituationalPilots(source.slice(0,-1));
 assert.equal(cut.valid,false);
 assert.equal(auditExpandedA1SituationalPilots(
  [...source.slice(0,last),{...source[last],publicAvailable:true,canScore:true}]
 ).valid,false);
});
