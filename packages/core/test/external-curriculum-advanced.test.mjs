/** Regression for historical C1/C2 editorial material. Synthetic fixtures test
 * the import contract, NOT the existence or quality of source V2 lesson files.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExternalCurriculumCandidate,catalogueExternalCurriculum,classifyExternalDraftEvidence} from '../dist/index.js';

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

test('metadata-only C1/C2 objectives are accounted for as outlines, not authored lessons',()=>{
 const units=['C1','C2'].flatMap(level=>languages.map(language=>example(level,1,language)));
 const result=catalogueExternalCurriculum({units});
 assert.equal(result.acceptedForReview,true);
 assert.equal(result.entries.length,12);
 assert.equal(result.outlineOnlyCount,12);
 assert.equal(result.textDraftCount,0);
 assert.ok(result.entries.every(x=>x.contentEvidence==='outline-only'&&x.publicAvailable===false));
});
test('real text is distinguishable from a skeleton but never earns publication or mastery',()=>{
 const outline=example('C2',1,'it');
 const authored={...example('C1',1,'fr-CA'),activities:[
  {kind:'listening',prompt:'Explain which claim the speaker qualifies'},
  {kind:'interaction',instructions:'Ask for clarification politely'}
 ]};
 const dialogue={...example('B2',2,'en-CA'),dialogue:[{text:'I can accept the proposal with conditions.'}]};
 const utterances={...example('B1',4,'de'),utterances:{model:'Das verstehe ich nicht.',interlocutor_prompt:'Können Sie das erklären?'}};
 const fake={...example('A2',3,'es'),activities:[{kind:'listening',id:'a1'}],dialogue:['  ']};
 const result=catalogueExternalCurriculum({units:[outline,authored,dialogue,utterances,fake]});
 assert.equal(result.acceptedForReview,true);
 assert.equal(result.outlineOnlyCount,2);
 assert.equal(result.textDraftCount,3);
 assert.deepEqual(result.entries.map(x=>x.contentEvidence),[
  'outline-only','text-draft-unreviewed','text-draft-unreviewed',
  'text-draft-unreviewed','outline-only'
 ]);
 assert.ok(result.entries.every(x=>x.publicAvailable===false&&x.reviewState==='candidate-only'));
 assert.equal(classifyExternalDraftEvidence({activities:[{title:'Plan to write a lesson'}]}),'outline-only');
 assert.equal(classifyExternalDraftEvidence({activities:[{prompt:'   '}]}),'outline-only');
});
test('malformed external curriculum returns no fake editorial evidence statistics',()=>{
 const result=catalogueExternalCurriculum({units:[{...example('C2',1,'it'),status:{publishable:true},activities:['Hello']}]});
 assert.equal(result.acceptedForReview,false);
 assert.equal(result.entries.length,0);
 assert.equal(result.textDraftCount,0);
 assert.equal(result.outlineOnlyCount,0);
});
