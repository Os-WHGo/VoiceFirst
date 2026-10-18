import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,availableLessons} from '../dist/index.js';
test('six languages each expose six offline authored lessons',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale);
  assert.equal(lessons.length,6);
  assert.equal(new Set(lessons.map(l=>l.id)).size,6);
  assert.ok(lessons.every(l=>l.exercises.length===4&&l.attribution==='original'));
  assert.equal(availableLessons(newCourseProgress(locale)).length,1);
 }
});
test('every prerequisite points to a lesson in the same language',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale), ids=new Set(lessons.map(l=>l.id));
  assert.ok(lessons.every(l=>!l.prerequisite||ids.has(l.prerequisite)));
 }
});
