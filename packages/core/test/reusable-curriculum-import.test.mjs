import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectReusableCurriculumImport,targetLanguages} from '../dist/index.js';

const concept={id:'concept.a0.hello',level:'A0',goal:'Recognize hello',prerequisites:[],skills:['listening']};
const unit=targetLanguage=>({conceptId:concept.id,targetLanguage,dialogue:['Hello'],vocabulary:['hello'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false});
const support=knownLanguage=>({conceptId:concept.id,knownLanguage,instructions:'Listen',editorialStatus:'candidate'});
const packageOf=(units=[],supports=[])=>({concepts:[concept],units,supports});

test('quarantine rejects missing package arrays and duplicate resources',()=>{
 assert.equal(inspectReusableCurriculumImport({}).acceptedForReview,false);
 const duplicate=inspectReusableCurriculumImport(packageOf([unit('en-CA'),unit('en-CA')],[support('es')]));
 assert.equal(duplicate.acceptedForReview,false);
 assert.ok(duplicate.errors.some(e=>e.includes('Duplicate target-language')));
});
test('quarantine rejects orphan and malformed resources without publishing',()=>{
 const orphan=inspectReusableCurriculumImport(packageOf([{...unit('fr-CA'),conceptId:'unknown'}],[support('es')]));
 assert.equal(orphan.acceptedForReview,false);
 assert.equal(orphan.coverage.length,0);
 const malformed=inspectReusableCurriculumImport(packageOf([{...unit('fr-CA'),dialogue:['']}],[support('es')]));
 assert.equal(malformed.acceptedForReview,false);
});
test('accepted candidates report real directed-pair coverage, not approval',()=>{
 const partial=inspectReusableCurriculumImport(packageOf([unit('fr-CA')],[support('es')]));
 assert.equal(partial.acceptedForReview,true);
 assert.equal(partial.coverage[0].candidatePairs,1);
 assert.equal(partial.coverage[0].missingPairs,29);
 assert.equal(partial.readyForPublicRelease,false);
 const full=inspectReusableCurriculumImport(packageOf(targetLanguages.map(unit),targetLanguages.map(support)));
 assert.equal(full.acceptedForReview,true);
 assert.equal(full.coverage[0].candidatePairs,30);
 assert.equal(full.readyForPublicRelease,false);
});

test('C1 and C2 activity-only drafts compose across directed pairs without invented dialogue',()=>{
 for(const level of ['C1','C2']){
  const upper={...concept,id:'concept.'+level+'.argument',level,goal:'Evaluate an argument',skills:['listening','interaction']};
  const units=targetLanguages.map(targetLanguage=>({
   conceptId:upper.id,targetLanguage,dialogue:[],activities:['Examine the claim and explain the uncertainty'],
   vocabulary:['evidence'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false
  }));
  const helps=targetLanguages.map(knownLanguage=>({
   conceptId:upper.id,knownLanguage,instructions:'Analyze the argument',editorialStatus:'candidate'
  }));
  const inspected=inspectReusableCurriculumImport({concepts:[upper],units,supports:helps});
  assert.equal(inspected.acceptedForReview,true,JSON.stringify(inspected.errors));
  assert.equal(inspected.coverage[0].candidatePairs,30);
  assert.equal(inspected.readyForPublicRelease,false);
 }
});
test('import blocks empty and malformed activity-only drafts rather than inventing content',()=>{
 const activityOnly={...unit('fr-CA'),dialogue:[],activities:['Observe the intended meaning']};
 assert.equal(inspectReusableCurriculumImport(packageOf([activityOnly],[support('es')])).acceptedForReview,true);
 for(const malformed of [
  {...activityOnly,activities:[]},
  {...activityOnly,activities:['']},
  {...activityOnly,activities:['Valid',0]},
  {...activityOnly,activities:'A prompt'},
  {...activityOnly,dialogue:[' ']},
 ]){
  assert.equal(inspectReusableCurriculumImport(packageOf([malformed],[support('es')])).acceptedForReview,false);
 }
});

test('prerequisite graph accepts an ordered A0–C2 path without inventing authored lessons',()=>{
 const levels=['A0','A1','A2','B1','B2','C1','C2'];
 const chain=levels.map((level,index)=>({
  ...concept,id:'concept.path.'+level,level,goal:'Practice skill at '+level,
  prerequisites:index===0?[]:['concept.path.'+levels[index-1]]
 }));
 const items=chain.flatMap(c=>targetLanguages.map(targetLanguage=>({
  ...unit(targetLanguage),conceptId:c.id,dialogue:[],
  activities:['Recognize and respond in a practice situation']
 })));
 const helps=chain.flatMap(c=>targetLanguages.map(knownLanguage=>({
  ...support(knownLanguage),conceptId:c.id
 })));
 const report=inspectReusableCurriculumImport({concepts:chain,units:items,supports:helps});
 assert.equal(report.acceptedForReview,true,JSON.stringify(report.errors));
 assert.equal(report.coverage.length,7);
 assert.ok(report.coverage.every(c=>c.candidatePairs===30&&c.missingPairs===0));
 assert.equal(report.readyForPublicRelease,false);
});
test('an unavailable or future-level prerequisite cannot be imported as a usable path',()=>{
 const a={...concept,id:'concept.root',level:'A1'};
 const b={...concept,id:'concept.advanced',level:'C2'};
 for(const [dependency,expected] of [
  [{...a,prerequisites:['concept.unknown']},'Missing prerequisite'],
  [{...a,prerequisites:['concept.advanced']},'Future-level prerequisite'],
 ]){
  const report=inspectReusableCurriculumImport({concepts:[dependency,b],units:[],supports:[]});
  assert.equal(report.acceptedForReview,false);
  assert.equal(report.coverage.length,0,'no partial coverage should be endorsed');
  assert.ok(report.errors.some(e=>e.includes(expected)),JSON.stringify(report.errors));
  assert.equal(report.readyForPublicRelease,false);
 }
});
test('same-level and cross-level cycles fail closed, without recursion into learners data',()=>{
 const root={...concept,id:'concept.a1.first',level:'A1',prerequisites:['concept.a1.second']};
 const same={...concept,id:'concept.a1.second',level:'A1',prerequisites:['concept.a1.first']};
 const result=inspectReusableCurriculumImport({concepts:[root,same],units:[],supports:[]});
 assert.equal(result.acceptedForReview,false);
 assert.ok(result.errors.some(e=>e.startsWith('Cyclic prerequisite')));
 const rootOk={...root,prerequisites:[]};
 const ordered=inspectReusableCurriculumImport({concepts:[rootOk,same],units:[],supports:[]});
 assert.equal(ordered.acceptedForReview,true);
 assert.equal(ordered.coverage.length,2);
});
