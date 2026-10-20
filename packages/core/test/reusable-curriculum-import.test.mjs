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
