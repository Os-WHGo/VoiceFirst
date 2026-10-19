import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,recordCourseAttempt} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('every original alternative counts as valid offline course evidence',()=>{
 let count=0;
 for(const language of languages)for(const lesson of lessonsFor(language))for(const exercise of lesson.exercises){
  for(const phrase of exercise.alternatives){
   const base=newCourseProgress(language);
   const result=recordCourseAttempt(base,exercise,{kind:'match',recognized:phrase},'2026-10-17');
   assert.equal(result.correct[exercise.id],1,exercise.id);
   count++;
  }
 }
 assert.ok(count>=336);
});
