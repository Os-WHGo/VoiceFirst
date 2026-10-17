import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,lessonsFor,offlineLessons,newCourseProgress,availableLessons,checkUtterance,recordCourseAttempt,finishLesson,normalizedUtterance,nextAudioStep,curriculumPlanFor,officialCefrBands} from '../dist/index.js';
const day='2026-10-16';
test('12 authored lessons, two for every language',()=>{ assert.equal(offlineLessons.length,12);for(const lang of targetLanguages)assert.equal(lessonsFor(lang).length,2); });
test('30 directed language combinations can use localized help and authored target utterance',()=>{ for(const [native,target] of learningPairs()){const lesson=lessonsFor(target)[0];assert.equal(typeof lesson.goal[native],'string');assert.ok(lesson.exercises[0].meaning[native]);assert.equal(nextAudioStep(lesson,0,native).language,target); } });
test('only prerequisite-free lesson is unlocked at start',()=>{ const p=newCourseProgress('fr-CA');assert.equal(availableLessons(p).length,1); });
test('high confidence exact alternatives are accepted without API',()=>{const item=lessonsFor('en-CA')[1].exercises[2];assert.equal(checkUtterance(item,'Could you give me a hand?','en-CA','high').kind,'match');});
test('normalization respects punctuation and accents without changing message meaning',()=>{assert.equal(normalizedUtterance('  ¿PODRÍAS   ayudarme?! ','es'),'podrias ayudarme');});
test('uncertain ASR cannot be recorded as a failure',()=>{const l=lessonsFor('es')[0];const p=newCourseProgress('es');const item=l.exercises[2];const result=checkUtterance(item,'???','es','low');assert.equal(recordCourseAttempt(p,item,result,day),p);});
test('semantic mismatch is retry, never silently passed',()=>{const e=lessonsFor('de')[0].exercises[2];assert.equal(checkUtterance(e,'Something unrelated','de','high').kind,'retry');});
test('completing both recall and checkpoint unlocks next lesson',()=>{const l=lessonsFor('it')[0];let p=newCourseProgress('it');p=recordCourseAttempt(p,l.exercises[2],{kind:'match',recognized:'Ciao!'},day);assert.equal(finishLesson(p,l).completed.length,0);p=recordCourseAttempt(p,l.exercises[3],{kind:'match',recognized:'Ciao!'},day);p=finishLesson(p,l);assert.equal(p.completed.length,1);assert.equal(availableLessons(p).length,2);assert.equal(p.due[l.exercises[2].id],'2026-10-17');});
test('completion is idempotent',()=>{const l=lessonsFor('en-CA')[0];let p=newCourseProgress('en-CA');for(const i of [2,3])p=recordCourseAttempt(p,l.exercises[i],{kind:'match',recognized:'Hi'},day);p=finishLesson(finishLesson(p,l),l);assert.equal(p.completed.length,1);});
test('completion cannot cross languages',()=>{assert.throws(()=>finishLesson(newCourseProgress('es'),lessonsFor('en-CA')[0]),/Language mismatch/)});

test('content-first curriculum inventory covers 6 levels and 8 units for each of six targets',()=>{
 for(const language of targetLanguages){
  const units=curriculumPlanFor(language);
  assert.equal(units.length,48);
  assert.equal(new Set(units.map(x=>x.level+':'+x.unitId)).size,48);
  assert.ok(units.every(x=>x.targetLanguage===language&&x.status==='planned'));
  for(const level of officialCefrBands)assert.equal(units.filter(x=>x.level===level).length,8);
 }
});
