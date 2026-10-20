import test from 'node:test';
import assert from 'node:assert/strict';
import {composeCurriculumCandidate,targetLanguages} from '../dist/index.js';
const levels=['A0','A1','A2','B1','B2','C1','C2'];
test('one neutral concept composes across all 30 directed language pairs for every level',()=>{
 for(const level of levels){
  const concept={id:'concept.greeting.'+level,level,goal:'Greet someone',prerequisites:[],skills:['listening','speaking']};
  for(const knownLanguage of targetLanguages)for(const targetLanguage of targetLanguages){
   const unit={conceptId:concept.id,targetLanguage,dialogue:['Hello'],vocabulary:['hello'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false};
   const support={conceptId:concept.id,knownLanguage,instructions:'Practise a greeting',editorialStatus:'candidate'};
   const composed=composeCurriculumCandidate(concept,unit,support);
   if(knownLanguage===targetLanguage){assert.equal(composed,null);continue;}
   assert.equal(composed.level,level);
   assert.equal(composed.knownLanguage,knownLanguage);
   assert.equal(composed.targetLanguage,targetLanguage);
   assert.equal(composed.readyForPublicRelease,false);
  }
 }
});
test('reject mismatched concepts and filter contrastive notes by ordered pair',()=>{
 const concept={id:'greeting',level:'A0',goal:'Greet',prerequisites:[],skills:['reading']};
 const unit={conceptId:'greeting',targetLanguage:'fr-CA',dialogue:['Bonjour'],vocabulary:['bonjour'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false};
 const support={conceptId:'greeting',knownLanguage:'es',instructions:'Saluda',editorialStatus:'candidate'};
 assert.equal(composeCurriculumCandidate(concept,{...unit,conceptId:'other'},support),null);
 const notes=[{conceptId:'greeting',knownLanguage:'es',targetLanguage:'fr-CA',note:'Pronunciación nasal',editorialStatus:'candidate'},{conceptId:'greeting',knownLanguage:'de',targetLanguage:'fr-CA',note:'Not applicable',editorialStatus:'candidate'}];
 assert.deepEqual(composeCurriculumCandidate(concept,unit,support,notes).contrastiveNotes,['Pronunciación nasal']);
});

test('review flags alone cannot authorize release from candidate composer',()=>{
 const concept={id:'concept.first-contact',level:'A0',goal:'Recognize a greeting',prerequisites:[],skills:['listening']};
 const unit={conceptId:concept.id,targetLanguage:'fr-CA',dialogue:['Bonjour'],vocabulary:['bonjour'],editorialStatus:'reviewed',rightsCleared:true,audioReviewed:true};
 const support={conceptId:concept.id,knownLanguage:'es',instructions:'Reconoce el saludo',editorialStatus:'reviewed'};
 const note={conceptId:concept.id,knownLanguage:'es',targetLanguage:'fr-CA',note:'Revisada',editorialStatus:'reviewed'};
 const composed=composeCurriculumCandidate(concept,unit,support,[note]);
 assert.equal(composed.readyForPublicRelease,false);
 assert.equal(composed.status,'candidate');
});

test('reject invalid skills, prerequisites, and empty multilingual payloads',()=>{
 const concept={id:'concept.hello',level:'A0',goal:'Say hello',prerequisites:[],skills:['listening']};
 const unit={conceptId:concept.id,targetLanguage:'it',dialogue:['Ciao'],vocabulary:['ciao'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false};
 const support={conceptId:concept.id,knownLanguage:'de',instructions:'Begrüße jemanden',editorialStatus:'candidate'};
 assert.equal(composeCurriculumCandidate({...concept,skills:[]},unit,support),null);
 assert.equal(composeCurriculumCandidate({...concept,skills:['invented']},unit,support),null);
 assert.equal(composeCurriculumCandidate({...concept,prerequisites:[concept.id]},unit,support),null);
 assert.equal(composeCurriculumCandidate({...concept,prerequisites:['x','x']},unit,support),null);
 assert.equal(composeCurriculumCandidate(concept,{...unit,dialogue:[' ']},support),null);
 assert.equal(composeCurriculumCandidate(concept,{...unit,vocabulary:[' ']},support),null);
 assert.equal(composeCurriculumCandidate(concept,unit,{...support,editorialStatus:'unknown'}),null);
 assert.deepEqual(composeCurriculumCandidate(concept,unit,support,[{conceptId:concept.id,knownLanguage:'de',targetLanguage:'it',note:' ',editorialStatus:'candidate'}]).contrastiveNotes,[]);
});
