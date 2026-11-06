import test from 'node:test';
import assert from 'node:assert/strict';
import {
 expandedA1GreetingPilots,a1ExpandedExpectedAudioIds,auditExpandedA1GreetingPilots,
 advancedListeningStoryboards,advancedStoryboardExpectedAudioIds,auditAdvancedListeningStoryboards,
 firstReleaseEditorialPackages,editorialPackagePreview,auditFirstReleaseProductionPackages,
 validateLessonPackage,lessonsFor
} from '../dist/index.js';

test('all A1 greeting pilots contain grounded original six-turn scripts without promotion',()=>{
 const result=auditExpandedA1GreetingPilots();
 assert.deepEqual(result,{
  valid:true,errors:[],scenes:3,turns:18,checks:9,
  approvedAudio:0,publicAvailable:false
 });
 assert.equal(a1ExpandedExpectedAudioIds.length,18);
 for(const scene of expandedA1GreetingPilots){
  const view=editorialPackagePreview(scene.targetLanguage,'A1',scene.unitId);
  assert.ok(view);
  assert.equal(view.lesson.activities.length,14);
  assert.equal(view.lesson.activities.filter(a=>a.kind==='listen').length,6);
  assert.equal(view.lesson.activities.filter(a=>a.kind==='choice').length,4);
  assert.equal(view.lesson.editorialStatus,'draft');
  assert.equal(view.lesson.audioStatus,'audio-missing');
  assert.equal(view.canAwardProgress,false);
  for(const check of scene.checks){
   const index=Number(check.afterTurnId.split('-')[1])-1;
   assert.ok(scene.turns[index].text.includes(check.verbatimEvidence));
   assert.ok(view.lesson.activities.some(a=>a.kind==='choice'&&
    a.options.some(o=>o.text===check.verbatimEvidence)));
  }
  assert.equal(lessonsFor(scene.targetLanguage).length,14);
 }
});

test('existing C1/C2 authored scenes are linked to their matching editorial package units',()=>{
 const report=auditAdvancedListeningStoryboards();
 assert.equal(report.valid,true,report.errors.join(';'));
 assert.equal(advancedListeningStoryboards.length,12);
 assert.equal(advancedStoryboardExpectedAudioIds.length,72);
 for(const scene of advancedListeningStoryboards){
  const view=editorialPackagePreview(scene.targetLanguage,scene.level,scene.unitId);
  assert.ok(view);
  const activities=view.lesson.activities;
  assert.equal(activities.length,16);
  assert.equal(activities.filter(a=>a.kind==='listen').length,8);
  assert.equal(activities.filter(a=>a.kind==='choice').length,4);
  assert.equal(view.publicAvailable,false);
  assert.equal(view.hasApprovedAudio,false);
  assert.equal(view.canAssess,false);
  for(const turn of scene.turns){
   assert.ok(activities.some(a=>a.kind==='listen'&&a.prompt.target===turn.text));
  }
  for(const check of scene.checks){
   const index=Number(check.afterTurnId.split('-')[1])-1;
   assert.ok(scene.turns[index].text.includes(check.verbatimEvidence));
   assert.ok(activities.some(a=>a.kind==='choice'&&a.options.some(o=>o.text===check.verbatimEvidence)));
  }
 }
});

test('all three package hashes remain valid with zero editorial/public claims',()=>{
 const report=auditFirstReleaseProductionPackages();
 assert.equal(report.structurallyValid,true,report.errors.join(';'));
 assert.equal(report.candidateLessons,144);
 assert.equal(report.draftActivities,1200);
 assert.equal(report.publiclyAvailableLessons,0);
 assert.equal(report.editoriallyApprovedLessons,0);
 assert.equal(report.verifiedVoiceClips,0);
 for(const pack of firstReleaseEditorialPackages){
  const result=validateLessonPackage(pack);
  assert.equal(result.structurallyValid,true,JSON.stringify(result.issues.filter(x=>x.severity==='error')));
  assert.equal(result.readyForPublication,false);
  assert.ok(result.publicationBlockers.includes('audio-not-verified'));
  assert.ok(result.publicationBlockers.includes('editorial-review-pending'));
 }
});

test('tampering with A1 evidence and approval flags is detected',()=>{
 const original=expandedA1GreetingPilots;
 const mutated=original.map((scene,i)=>i?scene:{
  ...scene,checks:scene.checks.map((check,j)=>j?check:{
   ...check,verbatimEvidence:'not actually spoken in the dialogue'
  })
 });
 assert.equal(auditExpandedA1GreetingPilots(mutated).valid,false);
 const promoted=original.map((scene,i)=>i?scene:{...scene,publicAvailable:true,canScore:true});
 assert.equal(auditExpandedA1GreetingPilots(promoted).valid,false);
 assert.equal(auditExpandedA1GreetingPilots([]).valid,false);
 assert.equal(auditExpandedA1GreetingPilots([null,...original.slice(1)]).valid,false);
});
