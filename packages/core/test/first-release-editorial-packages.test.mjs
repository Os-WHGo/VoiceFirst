import test from 'node:test';
import assert from 'node:assert/strict';
import {
 firstReleaseEditorialPackages,auditFirstReleaseProductionPackages,
 editorialPackagePreview,validateLessonPackage,lessonPackageDigest,
 expandedFirstReleasePilots,expandedPilotExpectedAudioIds,auditExpandedFirstReleasePilots,
 expandedA1GreetingPilots,a1ExpandedExpectedAudioIds,auditExpandedA1GreetingPilots,
 advancedListeningStoryboards,advancedStoryboardExpectedAudioIds,auditAdvancedListeningStoryboards,
 firstReleaseLanguages,officialCefrBands,curriculumUnitBlueprint,
 lessonsFor,firstPublicReleaseReadiness
} from '../dist/index.js';

test('144 original first-release drafts map to three valid 48-unit offline editorial packages',()=>{
 const report=auditFirstReleaseProductionPackages();
 assert.deepEqual(report,{
  structurallyValid:true,errors:[],packages:3,
  candidateLessons:144,draftActivities:1200,
  editoriallyApprovedLessons:0,verifiedVoiceClips:0,
  publiclyAvailableLessons:0,fullCoursesReady:0
 });
 assert.equal(firstReleaseEditorialPackages.length,3);
 for(const [i,target] of firstReleaseLanguages.entries()){
  const pack=firstReleaseEditorialPackages[i];
  assert.equal(pack.targetLanguage,target);
  assert.equal(pack.lessons.length,48);
  assert.equal(pack.contentSha256,lessonPackageDigest(pack.lessons));
  const validation=validateLessonPackage(pack);
  assert.equal(validation.structurallyValid,true,
   target+' '+JSON.stringify(validation.issues.filter(x=>x.severity==='error')));
  assert.equal(validation.readyForPublication,false);
  for(const blocker of ['editorial-review-pending','audio-not-verified','asr-not-validated'])
   assert.ok(validation.publicationBlockers.includes(blocker),target+' '+blocker);
  for(const level of officialCefrBands){
   assert.equal(pack.lessons.filter(l=>l.band===level).length,8);
   for(const unit of curriculumUnitBlueprint[level]){
    const view=editorialPackagePreview(target,level,unit);
    assert.ok(view);
    assert.equal(view.status,'editorial-only');
    assert.equal(view.lesson.activities.length,
     7+
     (expandedFirstReleasePilots.some(x=>x.targetLanguage===target&&x.level===level&&x.unitId===unit)?7:0)+
     (expandedA1GreetingPilots.some(x=>x.targetLanguage===target&&level==='A1'&&x.unitId===unit)?7:0)+
     (advancedListeningStoryboards.some(x=>x.targetLanguage===target&&x.level===level&&x.unitId===unit)?9:0));
    assert.equal(view.canAssess,false);
    assert.equal(view.canAwardProgress,false);
    assert.equal(view.hasApprovedAudio,false);
    assert.equal(view.publicAvailable,false);
    assert.ok(view.lesson.activities.every(a=>a.responseModes.every(m=>
     ['speech','typed','choice'].includes(m))));
    assert.ok(view.lesson.activities.filter(a=>a.kind!=='listen'&&a.kind!=='choice')
     .every(a=>a.responseModes.includes('typed')));
   }
  }
  assert.equal(lessonsFor(target).length,14,
   'editorial candidates must not leak into the existing A0/A1 learner session');
 }
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
});

test('packaged authored replies remain coherent with the existing answer evaluator',()=>{
 for(const pack of firstReleaseEditorialPackages){
  for(const lesson of pack.lessons){
   for(const a of lesson.activities){
    if(a.kind==='choice'){
     assert.ok(a.options.some(x=>x.id===a.correctOptionId));
    }
    if(['repeat','recall','checkpoint','dialogue-turn'].includes(a.kind)){
     assert.ok(a.model.length>0);
     assert.ok(a.accepted.includes(a.model));
     assert.ok(a.responseModes.includes('typed'));
    }
   }
  }
 }
});

test('changing original dialogue/metadata/rights invalidates the package or production audit',()=>{
 const one=firstReleaseEditorialPackages[0];
 const altered={
  ...one,lessons:one.lessons.map((lesson,i)=>i?lesson:{
   ...lesson,activities:lesson.activities.map((a,j)=>j===0?
    {...a,prompt:{...a.prompt,target:'A fabricated dialogue line.'}}:a)
  })
 };
 const tampered=[altered,...firstReleaseEditorialPackages.slice(1)];
 assert.equal(auditFirstReleaseProductionPackages(tampered).structurallyValid,false);
 assert.equal(validateLessonPackage(altered).structurallyValid,false,
  'modification without SHA update must be rejected');
 const fakeApproved={...one,lessons:one.lessons.map((lesson,i)=>i?lesson:{
  ...lesson,editorialStatus:'final',audioStatus:'audio-verified',asrStatus:'asr-validated'
 })};
 fakeApproved.contentSha256=lessonPackageDigest(fakeApproved.lessons);
 assert.equal(auditFirstReleaseProductionPackages([fakeApproved,...firstReleaseEditorialPackages.slice(1)]).structurallyValid,false);
 assert.equal(auditFirstReleaseProductionPackages([]).structurallyValid,false);
 assert.equal(editorialPackagePreview('de','A1','greetings-and-introductions'),null);
 assert.equal(editorialPackagePreview('en-CA','A0','greetings-and-introductions'),null);
 assert.equal(editorialPackagePreview('fr-CA','C2','does-not-exist'),null);
});

test('production audit rejects hostile or incomplete package inventories without throwing',()=>{
 const originals=firstReleaseEditorialPackages;
 for(const bad of [
  null,[null,...originals.slice(1)],
  [{...originals[0],lessons:null},...originals.slice(1)],
  [{...originals[0],lessons:[null,...originals[0].lessons.slice(1)]},...originals.slice(1)],
  [{...originals[0],targetLanguage:'it'},...originals.slice(1)]
 ]){
  assert.doesNotThrow(()=>auditFirstReleaseProductionPackages(bad));
  assert.equal(auditFirstReleaseProductionPackages(bad).structurallyValid,false);
 }
});

test('nine substantive A2-B2 expansions add 54 original turns, 27 grounded checks and 63 package activities',()=>{
 const audit=auditExpandedFirstReleasePilots();
 assert.deepEqual(audit,{
  valid:true,errors:[],scenes:9,dialogueTurns:54,
  comprehensionChecks:27,verifiedAudio:0,availableToLearners:false
 });
 assert.equal(expandedPilotExpectedAudioIds.length,54);
 assert.equal(new Set(expandedPilotExpectedAudioIds).size,54);
 for(const scene of expandedFirstReleasePilots){
  const view=editorialPackagePreview(scene.targetLanguage,scene.level,scene.unitId);
  assert.ok(view);
  assert.equal(view.lesson.activities.filter(x=>x.kind==='listen').length,6);
  assert.equal(view.lesson.activities.filter(x=>x.kind==='choice').length,4);
  assert.equal(view.lesson.audioStatus,'audio-missing');
  assert.equal(view.publicAvailable,false);
  for(const check of scene.checks){
   const i=Number(check.afterTurnId.split('-')[1])-1;
   assert.ok(scene.turns[i].text.includes(check.verbatimEvidence));
   assert.ok(view.lesson.activities.some(a=>a.kind==='choice'&&
    a.options.some(opt=>opt.text===check.verbatimEvidence)));
  }
 }
 const falsified=expandedFirstReleasePilots.map((x,i)=>i?x:
  {...x,publicAvailable:true,canScore:true});
 assert.equal(auditExpandedFirstReleasePilots(falsified).valid,false);
 const ungrounded=expandedFirstReleasePilots.map((x,i)=>i?x:{
  ...x,checks:x.checks.map((v,j)=>j?v:{...v,verbatimEvidence:'invented phrase not spoken'})
 });
 assert.equal(auditExpandedFirstReleasePilots(ungrounded).valid,false);
});
