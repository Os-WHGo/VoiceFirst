import test from 'node:test';
import assert from 'node:assert/strict';
import {auditExternalCurriculumCandidate} from '../dist/index.js';
test('external curriculum remains review-only',()=>{
 const r=auditExternalCurriculumCandidate({units:[{id:'new-english-a2',unitId:'new-english-a2',skills:{listening:{}},level:'A2',targetLanguage:'en-CA'}]});
 assert.equal(r.acceptedForReview,true);assert.equal(r.readyForPublicRelease,false);
});
test('malformed, duplicate and cross-language candidate units are rejected',()=>{
 assert.equal(auditExternalCurriculumCandidate(null).acceptedForReview,false);
 const r=auditExternalCurriculumCandidate({units:[{id:'new-a1-unit',level:'A1',targetLanguage:'en-CA'},{id:'new-a1-unit',level:'A1',targetLanguage:'en-CA'},{id:'other-unit',level:'C3',targetLanguage:'fr-CA'}]});
 assert.equal(r.acceptedForReview,false);assert.equal(r.duplicates.length,1);assert.ok(r.errors.length>=2);
});

test('candidate canonical IDs reveal collisions with existing A1 drafts',()=>{
 const r=auditExternalCurriculumCandidate({units:[{id:'en-ca-a1-01-greetings',unitId:'greetings-and-introductions',level:'A1',targetLanguage:'en-CA',skills:{listening:{}}}]});
 assert.ok(r.collisions.includes('en-CA/greetings-and-introductions'));
 assert.equal(r.readyForPublicRelease,false);
});
