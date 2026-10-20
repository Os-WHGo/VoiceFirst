import test from 'node:test';
import assert from 'node:assert/strict';
import {auditConceptCoverage,targetLanguages} from '../dist/index.js';

const concept={id:'concept.a0.greeting',level:'A0',goal:'Recognize a greeting',prerequisites:[],skills:['listening']};
const unit=targetLanguage=>({conceptId:concept.id,targetLanguage,dialogue:['Greeting'],vocabulary:['greeting'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false});
const support=knownLanguage=>({conceptId:concept.id,knownLanguage,instructions:'Learn the greeting',editorialStatus:'candidate'});

test('empty authored materials never masquerade as 30 completed lessons',()=>{
 const report=auditConceptCoverage(concept,[],[]);
 assert.equal(report.totalPairs,30);
 assert.equal(report.candidatePairs,0);
 assert.equal(report.missingPairs,30);
 assert.ok(report.cells.every(cell=>cell.state==='missing-both'&&!cell.readyForPublicRelease));
});
test('one target with five known-language supports yields five candidate pairs',()=>{
 const report=auditConceptCoverage(concept,[unit('fr-CA')],targetLanguages.filter(l=>l!=='fr-CA').map(support));
 assert.equal(report.candidatePairs,5);
 assert.equal(report.missingPairs,25);
 assert.ok(report.cells.filter(c=>c.targetLanguage==='fr-CA').every(c=>c.state==='candidate'));
});
test('six target resources and six support resources compose 30 candidate pairs, never released',()=>{
 const report=auditConceptCoverage(concept,targetLanguages.map(unit),targetLanguages.map(support));
 assert.equal(report.candidatePairs,30);
 assert.ok(report.cells.every(c=>c.state==='candidate'&&c.structurallyComposable&&!c.readyForPublicRelease));
});
test('malformed or wrong-concept materials are not counted as available',()=>{
 const report=auditConceptCoverage(concept,[{...unit('fr-CA'),dialogue:[' ']},unit('de'),{...unit('it'),conceptId:'different'}],[support('es')]);
 assert.equal(report.candidatePairs,1);
 assert.equal(report.cells.find(c=>c.knownLanguage==='es'&&c.targetLanguage==='fr-CA').state,'missing-target');
 assert.equal(report.cells.find(c=>c.knownLanguage==='es'&&c.targetLanguage==='de').state,'candidate');
});
