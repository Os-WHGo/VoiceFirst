import test from 'node:test';import assert from 'node:assert/strict';
import {lessonsFor,initialCourseState,loadCourseState,courseStateToJSON,chooseCourseLesson,courseLessonStatus,
  checkUtterance,recordCourseAttempt,finishLesson} from '../dist/index.js';
test('initial course resumes first unlocked lesson without account',()=>{const s=initialCourseState('en-CA');assert.equal(chooseCourseLesson(s,'2026-10-16').id,'en-CA-a0-greeting');});
test('lesson cannot be marked mastered just by listening',()=>{const l=lessonsFor('fr-CA')[0];let p=initialCourseState('fr-CA');p=finishLesson(p,l);assert.equal(p.completed.length,0);});
test('real recall and independent checkpoint advance, survive roundtrip',()=>{
 const l=lessonsFor('de')[0];let p=initialCourseState('de');for(const e of l.exercises.filter(x=>x.type==='recall'||x.type==='checkpoint')){
 const r=checkUtterance(e,e.alternatives[0],'de','high');p=recordCourseAttempt(p,e,r,'2026-10-16');}
 p=finishLesson(p,l);assert.ok(p.completed.includes(l.id));
 const r=loadCourseState(courseStateToJSON(p),'de');assert.equal(r.kind,'ok');
 assert.equal(chooseCourseLesson(r.progress,'2026-10-16').id,lessonsFor('de')[1].id);
 assert.equal(chooseCourseLesson(r.progress,'2026-10-18').id,l.id);
});
test('different target, corrupted JSON or forged completion never silently reset',()=>{
 const p=initialCourseState('it'),raw=courseStateToJSON(p);
 assert.equal(loadCourseState(raw,'es').kind,'invalid');
 assert.equal(loadCourseState('broken','it').kind,'invalid');
 assert.equal(loadCourseState(JSON.stringify({...p,completed:[lessonsFor('it')[1].id]}),'it').kind,'invalid');
});
test('bad counters and dates rejected at storage boundary',()=>{
 const p=initialCourseState('pt-BR');const l=lessonsFor('pt-BR')[0];
 assert.equal(loadCourseState(JSON.stringify({...p,correct:{[l.exercises[2].id]:3}}),'pt-BR').kind,'invalid');
 assert.equal(loadCourseState(JSON.stringify({...p,due:{[l.exercises[2].id]:'2026-02-30'}}),'pt-BR').kind,'invalid');
});
test('child-facing labels and stored course never imply CEFR assessment',()=>{const s=initialCourseState('es');assert.equal(courseLessonStatus(s,lessonsFor('es')[1]),'locked');});

test('malformed due dates cannot force completed lesson back into review',()=>{
 const lessons=lessonsFor('en-CA');
 const first=lessons[0];
 const state={...initialCourseState('en-CA'),completed:[first.id],due:{[first.exercises[2].id]:'0000-00-00'}};
 assert.equal(chooseCourseLesson(state,'2026-10-18')?.id,lessons[1].id);
});

test('six-language persistence rejects forged counters, wrong-language lessons and impossible dates',()=>{
 for(const language of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const base=initialCourseState(language);
  const first=lessonsFor(language)[0];
  const exercise=first.exercises[2];
  assert.equal(loadCourseState(courseStateToJSON(base),language).kind,'ok');
  for(const bad of [
   {...base,attempts:{[exercise.id]:-1}},
   {...base,attempts:{[exercise.id]:1.5}},
   {...base,attempts:{[exercise.id]:1},correct:{[exercise.id]:2}},
   {...base,due:{[exercise.id]:'2026-02-30'}},
   {...base,completed:[first.id,first.id]},
   {...base,completed:[first.id]},
   {...base,attempts:{'foreign-exercise':1}}
  ])assert.equal(loadCourseState(JSON.stringify(bad),language).kind,'invalid');
  assert.throws(()=>chooseCourseLesson(base,'2026-02-30'),/Invalid local date/);
 }
});
