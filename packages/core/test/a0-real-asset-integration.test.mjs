/** Integration contract for the actual, unchanged A0 candidate asset bundled by mobile. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadA0CandidateCatalog} from '../dist/index.js';

const path=fileURLToPath(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url));
const raw=JSON.parse(readFileSync(path,'utf8'));
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];

test('actual A0 asset loads atomically and remains unpublished',()=>{
 const result=loadA0CandidateCatalog(raw);
 assert.equal(result.kind,'candidate',JSON.stringify(result.issues));
 assert.equal(result.publishable,false);
 assert.equal(result.lessons.length,36);
 for(const target of languages){
  const lessons=result.lessons.filter(l=>l.targetLanguage===target);
  assert.equal(lessons.length,6,target);
  assert.deepEqual(lessons.map(l=>l.sequence),[1,2,3,4,5,6],target);
  for(const lesson of lessons){
   assert.equal(lesson.publishable,false);
   assert.equal(lesson.humanReviewRequired,true);
   assert.equal(lesson.options.length,3);
   assert.ok(lesson.options.some(option=>option.id===lesson.correctOptionId));
   for(const known of languages.filter(x=>x!==target)){
    assert.ok(lesson.contextByKnownLanguage[known]?.trim(),target+' context '+known);
    assert.ok(lesson.promptByKnownLanguage[known]?.trim(),target+' prompt '+known);
   }
  }
 }
});
test('actual A0 asset rejects tampered answer without partial loading',()=>{
 const altered=structuredClone(raw);
 altered.lessons[0].activity.correct_option_ids=['not-an-option'];
 const result=loadA0CandidateCatalog(altered);
 assert.equal(result.kind,'blocked');
 assert.equal(result.lessons.length,0);
 assert.ok(result.issues.some(issue=>issue.code==='INVALID_ANSWER'));
});
