import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExternalCurriculumCandidate,catalogueExternalCurriculum} from '../dist/index.js';
const skills=Object.fromEntries(['listening','speaking','reading','writing','interaction','mediation'].map(s=>[s,{}]));
const unit=(id,unitId=id)=>({id,unitId,level:'A1',skills,status:{publishable:false}});
test('Canadian French metadata.target remains quarantined',()=>{
 const r=catalogueExternalCurriculum({metadata:{language:'fr-CA',target:'fr-CA'},units:[unit('fr-ca-a1-salut','greetings-and-introductions')]});
 assert.equal(r.acceptedForReview,true);assert.equal(r.entries[0].targetLanguage,'fr-CA');assert.equal(r.entries[0].publicAvailable,false);assert.equal(r.readyForPublicRelease,false);
});
test('English metadata.targetLanguage accepted',()=>{
 const r=catalogueExternalCurriculum({metadata:{language:'en-CA',targetLanguage:'en-CA'},units:[unit('en-ca-a2-test')]});
 assert.equal(r.acceptedForReview,true);assert.equal(r.entries[0].targetLanguage,'en-CA');
});
test('metadata conflict and unit locale mismatch rejected',()=>{
 assert.equal(auditExternalCurriculumCandidate({metadata:{language:'fr-CA',targetLanguage:'en-CA'},units:[unit('test-unit')]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({metadata:{language:'fr-CA'},units:[{...unit('test-unit'),targetLanguage:'en-CA'}]}).acceptedForReview,false);
});
test('duplicate canonical identifiers and unsupported locales rejected',()=>{
 assert.equal(auditExternalCurriculumCandidate({metadata:{language:'fr-CA'},units:[unit('first-unit','same-topic'),unit('second-unit','same-topic')]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({metadata:{language:'xx'},units:[unit('test-unit')]}).acceptedForReview,false);
});
