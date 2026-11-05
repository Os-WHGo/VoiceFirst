import test from 'node:test';
import assert from 'node:assert/strict';
import {
 advancedListeningStoryboards,advancedStoryboardTopics,
 advancedStoryboardExpectedAudioIds,advancedStoryboardAudioBaseline,
 advancedStoryboardPreview,auditAdvancedListeningStoryboards,
 firstReleaseLanguages,firstReleaseLanguagePairs,comingSoonLanguages,
 advancedEditorialDrafts,lessonsFor,firstPublicReleaseReadiness
} from '../dist/index.js';

test('12 C1/C2 extended scenes provide 72 original turns, 36 literal-evidence checks, no audio',()=>{
 const report=auditAdvancedListeningStoryboards();
 assert.deepEqual(report,{
  valid:true,errors:[],expectedScenes:12,actualScenes:12,
  scriptedAudioTurns:72,editorialChecks:36,humanReviewed:0,
  verifiedAudioTurns:0,readyForPublicRelease:false
 });
 assert.equal(advancedListeningStoryboards.length,12);
 assert.equal(advancedEditorialDrafts.length,48,'source editorial inventory is unchanged');
 const ids=new Set(),audio=new Set();
 for(const target of firstReleaseLanguages){
  const scenes=advancedListeningStoryboards.filter(scene=>scene.targetLanguage===target);
  assert.equal(scenes.length,4);
  for(const level of ['C1','C2']){
   assert.deepEqual(
    scenes.filter(scene=>scene.level===level).map(scene=>scene.unitId),
    advancedStoryboardTopics[level]
   );
  }
  for(const scene of scenes){
   const id=target+'/'+scene.level+'/'+scene.unitId;
   assert.equal(scene.sceneId,id);
   assert.equal(ids.has(id),false);ids.add(id);
   assert.equal(scene.status,'draft');
   assert.equal(scene.editorialStatus,'not-human-reviewed');
   assert.equal(scene.audioStatus,'not-recorded');
   assert.equal(scene.rightsStatus,'pending-editorial-clearance');
   assert.equal(scene.publicAvailable,false);
   assert.equal(scene.canScore,false);
   assert.equal(scene.canCertify,false);
   assert.ok(scene.spokenFollowUp.length>=35);
   assert.ok(scene.noMicAlternative.length>=35);
   assert.equal(scene.turns.length,6);
   assert.equal(scene.checks.length,3);
   for(const [index,turn] of scene.turns.entries()){
    assert.equal(turn.id,'turn-'+(index+1));
    assert.equal(turn.speaker,index%2===0?'speaker-a':'speaker-b');
    assert.equal(audio.has(turn.audioId),false);
    audio.add(turn.audioId);
   }
   for(const [index,check] of scene.checks.entries()){
    assert.equal(check.afterTurnId,'turn-'+((index+1)*2));
    assert.ok(scene.turns[(index+1)*2-1].text.includes(check.verbatimEvidence));
    assert.notEqual(check.supportedInterpretation,check.unsupportedInterpretation);
   }
  }
  assert.equal(lessonsFor(target).length,14,'scenes cannot enter learner lessons');
 }
 assert.equal(ids.size,12);
 assert.equal(audio.size,72);
 assert.deepEqual(advancedStoryboardExpectedAudioIds,[...audio]);
 assert.equal(advancedStoryboardAudioBaseline.expected,72);
 assert.equal(advancedStoryboardAudioBaseline.verified,0);
 assert.equal(advancedStoryboardAudioBaseline.missing.length,72);
 assert.equal(advancedStoryboardAudioBaseline.readyForListening,false);
 assert.equal(advancedStoryboardAudioBaseline.readyForPublicRelease,false);
 for(const language of comingSoonLanguages){
  assert.equal(advancedListeningStoryboards.some(x=>x.targetLanguage===language),false);
  assert.equal(lessonsFor(language).length,14);
 }
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
});

test('24 directed help/target scene previews cannot play, assess, certify or award progress',()=>{
 let checked=0;
 for(const {known,target} of firstReleaseLanguagePairs){
  for(const [level,unitIds] of Object.entries(advancedStoryboardTopics))
   for(const unitId of unitIds){
    const view=advancedStoryboardPreview(known,target,level,unitId);
    assert.ok(view);
    assert.equal(view.status,'editorial-only');
    assert.equal(view.publicAvailable,false);
    assert.equal(view.verifiedAudioTurns,0);
    assert.equal(view.canPlayAudio,false);
    assert.equal(view.canAssess,false);
    assert.equal(view.canAwardProgress,false);
    assert.equal(view.turns.length,6);
    assert.equal(view.checks.length,3);
    assert.ok(view.help.instruction.length>30);
    assert.ok(view.help.fallback.length>30);
    checked++;
   }
 }
 assert.equal(checked,24);
 assert.equal(advancedStoryboardPreview('es','es','C1','nuance-and-register'),null);
 assert.equal(advancedStoryboardPreview('pt-BR','es','C1','nuance-and-register'),null);
 assert.equal(advancedStoryboardPreview('en-CA','it','C1','nuance-and-register'),null);
 assert.equal(advancedStoryboardPreview('en-CA','es','A1','nuance-and-register'),null);
 assert.equal(advancedStoryboardPreview('en-CA','fr-CA','C2','invented-topic'),null);
});

test('editorial QA fails closed on fabricated evidence, fake approvals, extra and missing scenes',()=>{
 const evidence=advancedListeningStoryboards.map((x,i)=>i?x:
  {...x,checks:x.checks.map((c,j)=>j?c:{...c,verbatimEvidence:'phrase not spoken in the scene'})});
 assert.ok(auditAdvancedListeningStoryboards(evidence).errors.some(x=>
  x.includes('UNGROUNDED_OR_AMBIGUOUS_CHECK')));
 const prematurelyPublished=advancedListeningStoryboards.map((x,i)=>i?x:
  {...x,publicAvailable:true,canScore:true,audioStatus:'recorded'});
 assert.ok(auditAdvancedListeningStoryboards(prematurelyPublished).errors.some(x=>
  x.includes('PREMATURE_STORYBOARD_PROMOTION')));
 const absent=auditAdvancedListeningStoryboards(advancedListeningStoryboards.slice(1));
 assert.equal(absent.valid,false);
 assert.ok(absent.errors.some(x=>x.includes('MISSING_STORYBOARD')));
 const repeated=auditAdvancedListeningStoryboards([...advancedListeningStoryboards,advancedListeningStoryboards[0]]);
 assert.equal(repeated.valid,false);
 assert.ok(repeated.errors.some(x=>x.includes('INVALID_OR_DUPLICATE_STORYBOARD')));
 const falseTurn=advancedListeningStoryboards.map((x,i)=>i?x:
  {...x,turns:x.turns.map((t,j)=>j? t : {...t,audioId:'https://remote-audio.invalid'})});
 assert.ok(auditAdvancedListeningStoryboards(falseTurn).errors.some(x=>
  x.includes('INVALID_STORYBOARD_TURN')));
 const malformed=advancedListeningStoryboards.map((x,i)=>i?x:
  {...x,turns:[null,...x.turns.slice(1)],checks:[null,...x.checks.slice(1)]});
 assert.equal(auditAdvancedListeningStoryboards(malformed).valid,false);
 assert.equal(auditAdvancedListeningStoryboards([null]).valid,false);
 assert.equal(auditAdvancedListeningStoryboards(null).valid,false);
 assert.equal(auditAdvancedListeningStoryboards(Array(49).fill(null)).valid,false);
});
