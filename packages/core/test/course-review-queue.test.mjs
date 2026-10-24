import test from 'node:test';
import assert from 'node:assert/strict';
import {courseReviewQueue,courseReviewSummary,voluntaryCourseReview,newCourseProgress,lessonsFor} from '../dist/index.js';
test('only completed lessons with due exercises enter offline review queue',()=>{
 const base=newCourseProgress('es');const lesson=lessonsFor('es')[0];const id=lesson.exercises[2].id;
 const pending={...base,due:{[id]:'2026-10-16'}};
 assert.equal(courseReviewQueue(pending,'2026-10-17').length,0);
 const completed={...pending,completed:[lesson.id]};
 assert.equal(courseReviewQueue(completed,'2026-10-15').length,0);
 assert.equal(courseReviewQueue(completed,'2026-10-17')[0].exercise.id,id);
 assert.deepEqual(courseReviewSummary(completed,'2026-10-17'),{due:1,overdue:1,completedLessons:1});
});
test('review queue rejects impossible calendar dates',()=>{
 assert.throws(()=>courseReviewQueue(newCourseProgress('fr-CA'),'2026-02-30'),/Invalid review date/);
});

test('voluntary reviews require prior completion and include recall/checkpoint',()=>{
 const p=newCourseProgress('de'), lesson=lessonsFor('de')[0];
 assert.deepEqual(voluntaryCourseReview(p,lesson.id),[]);
 const done={...p,completed:[lesson.id]};
 assert.deepEqual(voluntaryCourseReview(done,lesson.id).map(x=>x.exercise.type),['recall','checkpoint']);
 assert.deepEqual(voluntaryCourseReview(done,'missing'),[]);
});

test('review summary ignores stale and foreign-language completed IDs',()=>{
 const base=newCourseProgress('es');
 const valid=lessonsFor('es')[0].id;
 const foreign=lessonsFor('de')[0].id;
 const progress={...base,completed:[valid,foreign,'removed-lesson',valid]};
 assert.equal(courseReviewSummary(progress,'2026-10-18').completedLessons,1);
});

test('voluntary review hides malformed stored due dates without blocking practice',()=>{
 const lesson=lessonsFor('es')[0];
 const recall=lesson.exercises.find(e=>e.type==='recall');
 const progress={...newCourseProgress('es'),completed:[lesson.id],due:{[recall.id]:'2026-02-30'}};
 const entries=voluntaryCourseReview(progress,lesson.id);
 assert.equal(entries.length,2);
 assert.equal(entries.find(e=>e.exercise.id===recall.id).dueOn,'');
});

test('all six languages isolate their due review queues and voluntary exercises',()=>{
 for(const language of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(language);
  const completed=lessons[0];
  const dueExercise=completed.exercises.find(e=>e.type==='recall');
  const notCompleted=lessons[1];
  const future=completed.exercises.find(e=>e.type==='checkpoint');
  const state={...newCourseProgress(language),completed:[completed.id],due:{
   [dueExercise.id]:'2026-10-17',[future.id]:'2026-10-20',
   [notCompleted.exercises[2].id]:'2026-10-16',
   ['unknown-exercise']:'2026-10-16'
  }};
  const due=courseReviewQueue(state,'2026-10-18');
  assert.deepEqual(due.map(e=>e.exercise.id),[dueExercise.id]);
  assert.deepEqual(courseReviewSummary(state,'2026-10-18'),{due:1,overdue:1,completedLessons:1});
  assert.deepEqual(voluntaryCourseReview(state,completed.id).map(e=>e.exercise.type),['recall','checkpoint']);
  assert.deepEqual(voluntaryCourseReview(state,notCompleted.id),[]);
 }
});

test('due review queue sorts by date then weakest success count and exercise ID',()=>{
 const lesson=lessonsFor('en-CA')[0];
 const exercises=lesson.exercises;
 const state={...newCourseProgress('en-CA'),completed:[lesson.id],due:Object.fromEntries(exercises.map(e=>[e.id,'2026-10-17'])),correct:{[exercises[0].id]:2,[exercises[1].id]:0,[exercises[2].id]:1,[exercises[3].id]:0}};
 const queue=courseReviewQueue(state,'2026-10-18');
 assert.equal(queue.length,4);
 assert.deepEqual(queue.map(e=>e.correct),[0,0,1,2]);
 assert.deepEqual(queue.map(e=>e.exercise.id).slice(0,2),[exercises[1].id,exercises[3].id].sort());
});
