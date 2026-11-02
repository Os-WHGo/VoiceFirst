/** Regression for historical C1/C2 editorial material. Synthetic fixtures test
 * the import contract, NOT the existence or quality of source V2 lesson files.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExternalCurriculumCandidate,catalogueExternalCurriculum} from '../dist/index.js';

const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
const skills=Object.fromEntries(['listening','speaking','reading','writing','interaction','mediation'].map(s=>[s,{}]));
const example=(level,index,targetLanguage)=>({
 id:`${level}.${String(index).padStart(2,'0')}.${targetLanguage}`,
 unitId:`${level.toLowerCase()}-${String(index).padStart(2,'0')}`,
 level,targetLanguage,skills,status:{publishable:false},
});
test('a single quarantined inventory supports 96 C1/C2 candidate variants across six languages',()=>{
 const units=['C1','C2'].flatMap(level=>languages.flatMap(lang=>
  Array.from({length:8},(_,i)=>example(level,i+1,lang))));
 const audit=auditExternalCurriculumCandidate({units});
 assert.deepEqual(audit.errors,[]);
 assert.deepEqual(audit.duplicates,[]);
 assert.equal(audit.acceptedForReview,true);
 assert.equal(audit.unitCount,96);
 assert.equal(audit.readyForPublicRelease,false);
 const catalogue=catalogueExternalCurriculum({units});
 assert.equal(catalogue.acceptedForReview,true);
 assert.equal(catalogue.entries.length,96);
 for(const level of ['C1','C2']){
  for(const locale of languages){
   assert.equal(catalogue.entries.filter(e=>e.level===level&&e.targetLanguage===locale).length,8);
  }
 }
 assert.ok(catalogue.entries.every(e=>e.reviewState==='candidate-only'&&e.publicAvailable===false));
 assert.equal(catalogue.readyForPublicRelease,false);
});
test('B1 and B2 legacy candidates retain correct level and never become public',()=>{
 const catalogue=catalogueExternalCurriculum({metadata:{targetLanguage:'fr-CA'},units:[
  {...example('B1',1,'fr-CA'),id:'fr-ca-b1-test'},
  {...example('B2',1,'fr-CA'),id:'fr-ca-b2-test'},
 ]});
 assert.deepEqual(catalogue.entries.map(e=>e.level),['B1','B2']);
 assert.ok(catalogue.entries.every(e=>!e.publicAvailable));
});
test('mixed higher-level catalogues fail closed on ambiguous, inconsistent or duplicate sources',()=>{
 const first=example('C1',1,'en-CA'),second=example('C1',1,'fr-CA');
 assert.equal(auditExternalCurriculumCandidate({units:[first,{...second,targetLanguage:undefined}]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({metadata:{language:'en-CA'},units:[first,second]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({units:[first,{...first,id:'C1.02.en-CA'}]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({units:[{...first,id:'C1/../../test'}]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({units:[{...first,level:'C3'}]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({units:[{...first,status:{publishable:true}}]}).acceptedForReview,false);
 assert.equal(catalogueExternalCurriculum({units:[{...first,skills:{listening:{}}}]}).entries.length,0);
});
test('C1/C2 review-only inventory does not assert that historical draft activities are runnable',()=>{
 const draft=example('C2',8,'it');
 const catalogue=catalogueExternalCurriculum({units:[draft]});
 assert.equal(catalogue.acceptedForReview,true);
 assert.equal(catalogue.entries[0].publicAvailable,false);
 assert.equal('activities' in catalogue.entries[0],false);
});
