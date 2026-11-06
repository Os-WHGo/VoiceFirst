import test from 'node:test';
import assert from 'node:assert/strict';
import {
 expandedA1SituationalPilots,a1SituationalAudioIds,auditExpandedA1SituationalPilots,
 a1SituationTopics,expandedA1GreetingPilots,expandedFirstReleasePilots,
 advancedListeningStoryboards,firstReleaseLanguages,firstReleaseEditorialPackages,
 editorialPackagePreview,auditFirstReleaseProductionPackages,
 lessonPackageDigest,validateLessonPackage,lessonsFor
} from '../dist/index.js';

test('nine A1 scenes have six sourced turns, 27 literal checks and 54 planned audio IDs',()=>{
 const result=auditExpandedA1SituationalPilots();
 assert.deepEqual(result,{
  valid:true,errors:[],scenes:9,turns:54,checks:27,
  approvedAudio:0,availableToLearners:false
 });
 assert.equal(a1SituationalAudioIds.length,54);
 assert.equal(new Set(a1SituationalAudioIds).size,54);
 assert.equal(a1SituationTopics.length,3);
 for(const target of firstReleaseLanguages){
  const scenes=expandedA1SituationalPilots.filter(s=>s.targetLanguage===target);
  assert.equal(scenes.length,3,target);
  assert.deepEqual(scenes.map(s=>s.unitId),[...a1SituationTopics]);
  for(const scene of scenes){
   assert.equal(scene.turns.length,6);
   assert.equal(scene.checks.length,3);
   assert.equal(scene.publicAvailable,false);
   assert.equal(scene.audioStatus,'not-recorded');
   assert.equal(scene.editorialStatus,'not-human-reviewed');
   assert.ok(scene.mediationPrompt.length>65);
   assert.ok(scene.noMicAlternative.length>65);
   for(const [i,check] of scene.checks.entries()){
    assert.equal(check.afterTurnId,'turn-'+(i*2+2));
    assert.ok(scene.turns[i*2+1].text.includes(check.verbatimEvidence));
   }
  }
 }
});

test('three lesson packages integrate nine A1 scenes without changing six-language learner lessons',()=>{
 const report=auditFirstReleaseProductionPackages();
 assert.equal(report.structurallyValid,true,report.errors.join('; '));
 assert.deepEqual([
  report.packages,report.candidateLessons,report.draftActivities,
  report.editoriallyApprovedLessons,report.publiclyAvailableLessons,
  report.verifiedVoiceClips
 ],[3,144,1263,0,0,0]);
 for(const pack of firstReleaseEditorialPackages){
  const structurallyValid=validateLessonPackage(pack);
  assert.equal(structurallyValid.structurallyValid,true,
   structurallyValid.issues.filter(x=>x.severity==='error').map(x=>x.code).join(', '));
  assert.equal(structurallyValid.readyForPublication,false);
  assert.ok(structurallyValid.publicationBlockers.includes('audio-not-verified'));
  assert.ok(structurallyValid.publicationBlockers.includes('editorial-review-pending'));
  assert.equal(pack.contentSha256,lessonPackageDigest(pack.lessons));
  assert.equal(lessonsFor(pack.targetLanguage).length,14,
   'editorial-only A1 scenarios must not change playable original lessons');
 }
 for(const scene of expandedA1SituationalPilots){
  const preview=editorialPackagePreview(scene.targetLanguage,'A1',scene.unitId);
  assert.ok(preview);
  const activities=preview.lesson.activities;
  assert.equal(activities.length,14);
  assert.equal(activities.filter(a=>a.kind==='listen').length,6);
  assert.equal(activities.filter(a=>a.kind==='choice').length,4);
  assert.equal(preview.canAwardProgress,false);
  assert.equal(preview.canAssess,false);
  assert.equal(preview.hasApprovedAudio,false);
  assert.equal(preview.publicAvailable,false);
  assert.ok(activities.filter(a=>['repeat','recall','checkpoint','dialogue-turn'].includes(a.kind))
   .every(a=>a.responseModes.includes('typed')));
  for(const turn of scene.turns){
   assert.ok(activities.some(a=>a.kind==='listen'&&a.prompt.target===turn.text));
  }
  for(const check of scene.checks){
   assert.ok(activities.some(a=>a.kind==='choice'&&a.prompt.target===check.question&&
    a.options.some(o=>o.id===a.correctOptionId&&o.text===check.verbatimEvidence)&&
    a.options.some(o=>o.text===check.unsupportedInterpretation)));
  }
 }
 assert.equal(expandedA1GreetingPilots.length,3);
 assert.equal(expandedFirstReleasePilots.length,9);
 assert.equal(advancedListeningStoryboards.length,12);
});

test('tampered A1 source, evidence, duplicate scene or fake release fails safely',()=>{
 const original=expandedA1SituationalPilots;
 const replace=(patch)=>original.map((s,i)=>i? s:{...s,...patch(s)});
 const originalScene=original[0];
 for(const changed of [
  replace(s=>({publicAvailable:true,canScore:true})),
  replace(s=>({audioStatus:'audio-verified'})),
  replace(s=>({turns:s.turns.map((t,i)=>i===0?{...t,text:'Not the original source.'}:t)})),
  replace(s=>({checks:s.checks.map((q,i)=>i? q:{...q,verbatimEvidence:'Not in the scripted response'})})),
  replace(s=>({noMicAlternative:''})),
  replace(s=>({mediationPrompt:''})),
  [original[0],original[0],...original.slice(2)],
  [null,...original.slice(1)]
 ]){
  const audit=auditExpandedA1SituationalPilots(changed);
  assert.equal(audit.valid,false);
  assert.ok(audit.errors.length>0);
 }
 assert.equal(originalScene.audioStatus,'not-recorded');
 assert.equal(auditExpandedA1SituationalPilots([]).valid,false);
});

test('even a recomputed package hash cannot conceal changing A1 script evidence',()=>{
 const scene=expandedA1SituationalPilots[0];
 const pack=firstReleaseEditorialPackages.find(p=>p.targetLanguage===scene.targetLanguage);
 assert.ok(pack);
 const lessonId=scene.targetLanguage+'-a1-'+scene.unitId;
 const changedLessons=pack.lessons.map(lesson=>lesson.id!==lessonId?lesson:{
  ...lesson,activities:lesson.activities.map(a=>
   a.kind==='choice'&&a.prompt.target===scene.checks[1].question?
    {...a,correctOptionId:a.options.find(o=>o.text===scene.checks[1].unsupportedInterpretation).id}:a)
 });
 const changedPack={...pack,lessons:changedLessons,contentSha256:lessonPackageDigest(changedLessons)};
 assert.equal(validateLessonPackage(changedPack).structurallyValid,true);
 const inventory=firstReleaseEditorialPackages.map(p=>p.targetLanguage===scene.targetLanguage?changedPack:p);
 const audit=auditFirstReleaseProductionPackages(inventory);
 assert.equal(audit.structurallyValid,false);
 assert.ok(audit.errors.some(x=>x.startsWith('MISSING_STORYBOARD_EVIDENCE')));
});
