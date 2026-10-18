import test from 'node:test';
import assert from 'node:assert/strict';
import {courseReviewQueue,courseReviewSummary,newCourseProgress,lessonsFor} from '../dist/index.js';
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
