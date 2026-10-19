import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,recordCourseAttempt,finishLesson,availableLessons,courseReviewQueue,courseReviewSummary,courseStateToJSON,loadCourseState,voluntaryCourseReview} from '../dist/index.js';
const locales=['en-CA','fr-CA','es','pt-BR','de','it'];
test('all six offline learning paths can be completed and resumed without network',()=>{
 for(const language of locales){
  let state=newCourseProgress(language);
  const lessons=lessonsFor(language);
  for(let index=0;index<lessons.length;index++){
   const lesson=lessons[index];
   assert.equal(availableLessons(state).some(l=>l.id===lesson.id),true);
   for(const exercise of lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint')){
    state=recordCourseAttempt(state,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
   }
   state=finishLesson(state,lesson);
   assert.equal(state.completed.length,index+1);
   const restored=loadCourseState(courseStateToJSON(state),language);
   assert.equal(restored.kind,'ok');
   if(restored.kind==='ok')state=restored.progress;
  }
  assert.equal(state.completed.length,lessons.length);
  assert.equal(courseReviewQueue(state,'2026-10-18').length,lessons.length*2);
  assert.equal(courseReviewSummary(state,'2026-10-18').completedLessons,lessons.length);
  assert.equal(voluntaryCourseReview(state,lessons[0].id).length,2);
 }
});
test('an uncertain response never unlocks a course prerequisite',()=>{
 for(const language of locales){
  const lesson=lessonsFor(language)[0];
  let state=newCourseProgress(language);
  for(const exercise of lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint')){
   state=recordCourseAttempt(state,exercise,{kind:'uncertain',hint:'Uncertain audio'},'2026-10-17');
  }
  state=finishLesson(state,lesson);
  assert.equal(state.completed.length,0);
  assert.equal(availableLessons(state).length,1);
 }
});

test('all 84 lessons reject uncertain checkpoint and accept a subsequent confirmed retry',()=>{
 let retried=0;
 for(const language of locales){
  let state=newCourseProgress(language);
  for(const lesson of lessonsFor(language)){
   const critical=lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint');
   for(const exercise of critical){
    state=recordCourseAttempt(state,exercise,{kind:'uncertain',hint:'Audio unclear'},'2026-10-17');
   }
   state=finishLesson(state,lesson);
   assert.equal(state.completed.includes(lesson.id),false,`${lesson.id} must remain locked`);
   for(const exercise of critical){
    state=recordCourseAttempt(state,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
    retried++;
   }
   state=finishLesson(state,lesson);
   assert.equal(state.completed.includes(lesson.id),true,`${lesson.id} should unlock after verified practice`);
  }
 }
 assert.equal(retried,168);
});

test('all 84 completed lessons survive offline persistence and expose scheduled review',()=>{
 let reviews=0;
 for(const language of locales){
  let progress=newCourseProgress(language);
  for(const lesson of lessonsFor(language)){
   for(const exercise of lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint')){
    progress=recordCourseAttempt(progress,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
   }
   progress=finishLesson(progress,lesson);
   const loaded=loadCourseState(courseStateToJSON(progress),language);
   assert.equal(loaded.kind,'ok');
   if(loaded.kind!=='ok')continue;
   progress=loaded.progress;
   const voluntary=voluntaryCourseReview(progress,lesson.id);
   assert.equal(voluntary.length,2);
   assert.ok(voluntary.every(entry=>entry.lesson.id===lesson.id));
   reviews+=voluntary.length;
  }
  assert.equal(courseReviewQueue(progress,'2026-10-18').length,28);
 }
 assert.equal(reviews,168);
});

test('prerequisite bypass cannot complete any advanced lesson across six languages',()=>{
 let blocked=0;
 for(const language of locales){
  const lessons=lessonsFor(language);
  for(const lesson of lessons.filter(l=>l.prerequisite)){
   let state=newCourseProgress(language);
   for(const exercise of lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint')){
    state=recordCourseAttempt(state,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
   }
   const finished=finishLesson(state,lesson);
   assert.equal(finished.completed.includes(lesson.id),false,lesson.id);
   blocked++;
  }
 }
 assert.equal(blocked,78);
});

test('fabricated lesson IDs cannot be marked completed in any supported language',()=>{
 for(const language of locales){
  const base=newCourseProgress(language);
  const original=lessonsFor(language)[0];
  const fabricated={...original,id:`${language}-a1-forged`,prerequisite:undefined};
  let state=base;
  for(const exercise of fabricated.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint')){
   state=recordCourseAttempt(state,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
  }
  assert.equal(finishLesson(state,fabricated).completed.length,0);
 }
});

test('altered lesson exercise definitions cannot forge completion evidence',()=>{
 for(const language of locales){
  const original=lessonsFor(language)[0];
  const fakeRecall={...original.exercises[2],id:`${language}-forged-recall`};
  const fakeCheckpoint={...original.exercises[3],id:`${language}-forged-checkpoint`};
  const altered={...original,exercises:[...original.exercises.slice(0,2),fakeRecall,fakeCheckpoint]};
  let state=newCourseProgress(language);
  for(const exercise of [fakeRecall,fakeCheckpoint])state=recordCourseAttempt(state,exercise,{kind:'match',recognized:exercise.utterance},'2026-10-17');
  assert.equal(finishLesson(state,altered).completed.length,0);
 }
});

test('attempt boundary rejects unknown exercises and invalid calendar dates in all locales',()=>{
 for(const language of locales){
  const progress=newCourseProgress(language);
  const exercise=lessonsFor(language)[0].exercises[2];
  const fake={...exercise,id:`${language}-unknown-exercise`};
  assert.deepEqual(recordCourseAttempt(progress,fake,{kind:'match',recognized:fake.utterance},'2026-10-17'),progress);
  for(const invalid of ['2026-02-30','not-a-date','2026-13-01']){
   assert.throws(()=>recordCourseAttempt(progress,exercise,{kind:'match',recognized:exercise.utterance},invalid),/Invalid course attempt date/);
  }
  assert.deepEqual(recordCourseAttempt(progress,exercise,{kind:'uncertain',hint:'uncertain'},'2026-02-30'),progress);
 }
});
