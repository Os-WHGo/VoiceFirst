import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsFor,newCourseProgress,availableLessons} from '../dist/index.js';
test('six languages each expose fourteen offline authored lessons',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale);
  assert.equal(lessons.length,14);
  assert.equal(new Set(lessons.map(l=>l.id)).size,14);
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

test('self-introduction is chained after clarification in all six languages',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lesson=lessonsFor(locale).find(l=>l.id===`${locale}-a1-introduce`);
  assert.ok(lesson);
  assert.equal(lesson.prerequisite,`${locale}-a1-clarify`);
  assert.ok(lesson.exercises.every(e=>e.alternatives.length===2));
 }
});

test('shopping, opening hours and shift lessons form a sequential original path',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale);
  for(const [topic,previous] of [['price','introduce'],['hours','price'],['work','hours']]){
   const lesson=lessons.find(l=>l.id===`${locale}-a1-${topic}`);
   assert.ok(lesson);
   assert.equal(lesson.prerequisite,`${locale}-a1-${previous}`);
   assert.ok(lesson.exercises.every(e=>e.alternatives.length===2));
  }
 }
});

test('urgent help, allergy, payment and transport extend each language path',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale);
  for(const [topic,previous] of [['emergency','work'],['allergy','emergency'],['payment','allergy'],['transport','payment']]){
   const lesson=lessons.find(l=>l.id===`${locale}-a1-${topic}`);
   assert.ok(lesson);
   assert.equal(lesson.prerequisite,`${locale}-a1-${previous}`);
   assert.ok(lesson.exercises.every(e=>e.alternatives.length===2));
  }
 }
});

test('all 84 lessons have reachable acyclic prerequisites and 336 distinct exercises',()=>{
 let total=0;
 const globalIds=new Set();
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=lessonsFor(locale);
  const byId=new Map(lessons.map(l=>[l.id,l]));
  for(const lesson of lessons){
   const seen=new Set();
   let cursor=lesson;
   while(cursor){
    assert.ok(!seen.has(cursor.id),`Cycle in ${locale}: ${cursor.id}`);
    seen.add(cursor.id);
    cursor=cursor.prerequisite?byId.get(cursor.prerequisite):undefined;
    if(cursor===undefined)assert.ok(!lesson.prerequisite||seen.size>1||lesson===lessons[0]);
   }
   for(const exercise of lesson.exercises){
    assert.ok(!globalIds.has(exercise.id),`Duplicate exercise ${exercise.id}`);
    globalIds.add(exercise.id);
    assert.ok(exercise.alternatives.every(x=>typeof x==='string'&&x.trim().length>0));
    total++;
   }
  }
 }
 assert.equal(total,336);
 assert.equal(globalIds.size,336);
});
