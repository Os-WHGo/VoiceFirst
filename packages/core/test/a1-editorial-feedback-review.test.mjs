import test from 'node:test';
import assert from 'node:assert/strict';
import {
 firstReleaseLanguages,a1EditorialSceneTopics,startA1EditorialReview,
 currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,
 a1EditorialReviewVariantKeys,expandedA1GreetingPilots,expandedA1SituationalPilots,
 lessonsFor,firstPublicReleaseReadiness
} from '../dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const knownFor=target=>target==='en-CA'?'fr-CA':'en-CA';
test('24 A1 scenarios have a standalone 3-question interactive private review',()=>{
 assert.equal(scenes.length,24);
 assert.equal(a1EditorialSceneTopics.length,8);
 for(const target of firstReleaseLanguages){
  const authored=scenes.filter(s=>s.targetLanguage===target);
  assert.equal(authored.length,8);
  for(const scene of authored){
   let state=startA1EditorialReview(knownFor(target),target,scene.unitId);
   assert.ok(state,scene.sceneId);
   assert.equal(state.canScore,false);
   assert.equal(state.recordedProgress,false);
   assert.equal(state.publicAvailable,false);
   for(let index=0;index<3;index++){
    const step=currentA1EditorialReview(state,'fixed-seed');
    assert.equal(step.kind,'question');
    assert.equal(step.index,index);
    assert.equal(step.question,scene.checks[index].question);
    assert.deepEqual(new Set(step.options.map(x=>x.id)),new Set(['supported','unsupported']));
    assert.ok(!('revealedEvidence' in step));
    assert.equal(step.audioAvailable,false);
    assert.equal(step.canRecordProgress,false);
    assert.deepEqual(step.options,currentA1EditorialReview(state,'fixed-seed').options);
    const output=submitA1EditorialReview(state,{kind:'choice',optionId:'supported'});
    assert.equal(output.result,'supported');
    assert.equal(output.countsAsMastery,false);
    assert.equal(output.recordedProgress,false);
    state=advanceA1EditorialReview(output.state,'next');
    assert.equal(state.lastResult,null);
   }
   assert.equal(currentA1EditorialReview(state).kind,'complete');
   assert.equal(currentA1EditorialReview(state).certification,false);
  }
  assert.equal(lessonsFor(target).length,14);
 }
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
});

test('typed authored variants are accepted but unreviewed paraphrases are not penalized',()=>{
 for(const target of firstReleaseLanguages){
  const state=startA1EditorialReview(knownFor(target),target,'numbers-time-and-dates');
  const step=currentA1EditorialReview(state);
  const answer=step.options.find(x=>x.id==='supported').text;
  const exact=submitA1EditorialReview(state,{kind:'typed',text:answer});
  assert.equal(exact.result,'supported');
  const variant=target==='en-CA'?'At two in the afternoon':
   target==='fr-CA'?'À deux heures de l’après-midi':'A las dos de la tarde';
  assert.equal(submitA1EditorialReview(state,{kind:'typed',text:variant}).result,'supported');
  const unknown=submitA1EditorialReview(state,{
   kind:'typed',text:'This is a different fictional response, with no approved equivalent.'
  });
  assert.equal(unknown.result,'unverified');
  assert.equal(unknown.countsAsMastery,false);
  assert.equal(unknown.state.lastResult,'unverified');
  assert.ok(!JSON.stringify(unknown).includes('This is a different fictional response'));
 }
 assert.ok(a1EditorialReviewVariantKeys.length===24);
});

test('unsupported, skipped and hint states remain non-scoring and show evidence on demand',()=>{
 const s=startA1EditorialReview('es','en-CA','food-and-shopping');
 const clue=currentA1EditorialReview(s);
 assert.equal(clue.kind,'question');
 const shown=advanceA1EditorialReview(s,'reveal');
 const hint=currentA1EditorialReview(shown);
 assert.ok(hint.revealedEvidence.length>0);
 const wrong=submitA1EditorialReview(s,{kind:'choice',optionId:'unsupported'});
 assert.equal(wrong.result,'not-supported');
 assert.equal(wrong.state.revealed,true);
 assert.equal(wrong.countsAsMastery,false);
 assert.ok(wrong.feedback.length>15);
 assert.equal(submitA1EditorialReview(wrong.state,{kind:'choice',optionId:'supported'}),null,
  'a question cannot be answered twice without moving on');
 const nxt=advanceA1EditorialReview(wrong.state,'next');
 const skipped=submitA1EditorialReview(nxt,{kind:'skip'});
 assert.equal(skipped.result,'skipped');
 assert.equal(skipped.countsAsMastery,false);
 assert.equal(advanceA1EditorialReview(skipped.state,'restart').cursor,0);
 assert.equal(currentA1EditorialReview(advanceA1EditorialReview(s,'stop')).kind,'complete');
});

test('forged state, invalid inputs and overlong typed response fail closed',()=>{
 const s=startA1EditorialReview('es','en-CA','daily-routines');
 assert.ok(s);
 assert.equal(startA1EditorialReview('en-CA','en-CA','daily-routines'),null);
 assert.equal(startA1EditorialReview('es','pt-BR','daily-routines'),null);
 assert.equal(startA1EditorialReview('es','en-CA','does-not-exist'),null);
 for(const bad of [
  null,{...s,publicAvailable:true},{...s,canScore:true},
  {...s,recordedProgress:true},{...s,cursor:-1},{...s,cursor:4},
  {...s,phase:'completed'},{...s,lastResult:'graded'},
  {...s,sceneId:'en-CA/A1/unknown'}
 ]){
  assert.equal(currentA1EditorialReview(bad),null);
  assert.equal(submitA1EditorialReview(bad,{kind:'skip'}),null);
 }
 assert.equal(submitA1EditorialReview(s,{kind:'choice',optionId:'invented'}),null);
 assert.equal(submitA1EditorialReview(s,{kind:'typed',text:'x'.repeat(241)}),null);
 assert.equal(submitA1EditorialReview(s,{kind:'speech',text:'a'}),null);
 assert.equal(advanceA1EditorialReview(s,'invalid-command'),null);
});

test('localization, review order and result serialization never depend on user transcript',()=>{
 for(const target of firstReleaseLanguages){
  const state=startA1EditorialReview(knownFor(target),target,'personal-information');
  const supported=submitA1EditorialReview(state,{kind:'choice',optionId:'supported'});
  const unsupported=submitA1EditorialReview(state,{kind:'choice',optionId:'unsupported'});
  assert.notEqual(supported.feedback,unsupported.feedback);
  assert.equal(supported.result,'supported');
  assert.equal(unsupported.result,'not-supported');
  assert.equal(supported.state.knownLanguage,knownFor(target));
  assert.equal(supported.state.phase,'feedback');
  const step=currentA1EditorialReview(supported.state,'test-seed');
  assert.ok(step.feedback);
  assert.equal(step.canRecordProgress,false);
  const a=currentA1EditorialReview(state,'seed-one').options.map(x=>x.id);
  assert.deepEqual(a,currentA1EditorialReview(state,'seed-one').options.map(x=>x.id));
 }
});
