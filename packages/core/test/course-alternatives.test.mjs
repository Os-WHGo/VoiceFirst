import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,recordCourseAttempt,finishLesson} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('every original alternative is recognized while only retrieval stages earn course evidence',()=>{
 let count=0;
 for(const language of languages){
  let base=newCourseProgress(language);
  for(const lesson of lessonsFor(language)){
   for(const exercise of lesson.exercises){
    for(const phrase of exercise.alternatives){
     const result=recordCourseAttempt(base,exercise,{kind:'match',recognized:phrase},'2026-10-17');
     if(exercise.type==='recall'||exercise.type==='checkpoint')
      assert.equal(result.correct[exercise.id],1,exercise.id);
     else assert.equal(result,base,'listening and imitation remain unscored: '+exercise.id);
     count++;
    }
   }
   // Unlock the next lesson only through authentic scoring of both retrieval stages.
   for(const exercise of lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint'))
    base=recordCourseAttempt(base,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
   base=finishLesson(base,lesson);
   assert.ok(base.completed.includes(lesson.id),'prerequisite is complete: '+lesson.id);
  }
 }
 assert.ok(count>=336);
});
