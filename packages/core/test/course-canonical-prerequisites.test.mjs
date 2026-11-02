import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,recordCourseAttempt,finishLesson} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('tampered prerequisite cannot unlock any advanced lesson',()=>{
 let count=0;
 for(const language of languages)for(const lesson of lessonsFor(language).filter(x=>x.prerequisite)){
  let progress=newCourseProgress(language);
  for(const exercise of lesson.exercises.filter(x=>x.type==='recall'||x.type==='checkpoint')){
   progress=recordCourseAttempt(progress,exercise,{kind:'match',recognized:exercise.alternatives[0]},'2026-10-17');
  }
  const forged={...lesson,prerequisite:undefined};
  assert.deepEqual(finishLesson(progress,forged),progress,lesson.id);
  count++;
 }
 assert.equal(count,78);
});
