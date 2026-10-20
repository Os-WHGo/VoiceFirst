import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExternalCurriculumCandidate} from '../dist/index.js';
const skills=Object.fromEntries(['listening','speaking','reading','writing','interaction','mediation'].map(s=>[s,{}]));
const status={publishable:false};
test('external curriculum remains review-only',()=>{
 const r=auditExternalCurriculumCandidate({units:[{id:'new-english-a2',unitId:'new-english-a2',skills,status,level:'A2',targetLanguage:'en-CA'}]});
 assert.equal(r.acceptedForReview,true);assert.equal(r.readyForPublicRelease,false);
});
test('malformed, duplicate and cross-language candidate units are rejected',()=>{
 assert.equal(auditExternalCurriculumCandidate(null).acceptedForReview,false);
 const r=auditExternalCurriculumCandidate({units:[{id:'new-a1-unit',unitId:'new-a1-unit',skills,status,level:'A1',targetLanguage:'en-CA'},{id:'new-a1-unit',level:'A1',targetLanguage:'en-CA'},{id:'other-unit',unitId:'other-unit',skills,status,level:'C3',targetLanguage:'fr-CA'}]});
 assert.equal(r.acceptedForReview,false);assert.equal(r.duplicates.length,1);assert.ok(r.errors.length>=2);
});

test('candidate canonical IDs reveal collisions with existing A1 drafts',()=>{
 const r=auditExternalCurriculumCandidate({units:[{id:'en-ca-a1-01-greetings',unitId:'greetings-and-introductions',level:'A1',targetLanguage:'en-CA',skills,status}]});
 assert.ok(r.collisions.includes('en-CA/greetings-and-introductions'));
 assert.equal(r.readyForPublicRelease,false);
});

test('all six skills and explicit unpublished status are mandatory',()=>{
 const base={id:'new-a1',unitId:'new-a1',targetLanguage:'en-CA',level:'A1',skills,status};
 assert.equal(auditExternalCurriculumCandidate({units:[base]}).acceptedForReview,true);
 assert.equal(auditExternalCurriculumCandidate({units:[{...base,skills:{listening:{}}}]}).acceptedForReview,false);
 assert.equal(auditExternalCurriculumCandidate({units:[{...base,status:{publishable:true}}]}).acceptedForReview,false);
});
