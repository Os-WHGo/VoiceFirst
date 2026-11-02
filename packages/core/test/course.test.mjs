import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,lessonsFor,offlineLessons,newCourseProgress,availableLessons,checkUtterance,recordCourseAttempt,finishLesson,normalizedUtterance,matchesAuthoredAnswer,MAX_COURSE_RESPONSE_CHARS,nextAudioStep,chooseCourseLesson,loadCourseState,courseStateToJSON,curriculumPlanFor,officialCefrBands} from '../dist/index.js';
const day='2026-10-16';
test('84 authored lessons, fourteen for every language',()=>{ assert.equal(offlineLessons.length,12);for(const lang of targetLanguages)assert.equal(lessonsFor(lang).length,14); });
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

test('oversized local ASR or typed answer never consumes an attempt or becomes mastery evidence',()=>{
 for(const language of targetLanguages){
  const lesson=lessonsFor(language)[0];
  const recall=lesson.exercises.find(e=>e.type==='recall');
  const huge=recall.alternatives[0]+'a'.repeat(MAX_COURSE_RESPONSE_CHARS+1);
  const result=checkUtterance(recall,huge,language,'high');
  assert.equal(result.kind,'uncertain',language);
  assert.equal(normalizedUtterance(huge,language),'');
  assert.equal(matchesAuthoredAnswer(recall,huge,language),false);
  const original=newCourseProgress(language);
  assert.equal(recordCourseAttempt(original,recall,result,'2026-11-01'),original);
  assert.equal(recordCourseAttempt(original,recall,{kind:'match',recognized:huge},'2026-11-01'),original);
  const valid=checkUtterance(recall,recall.alternatives[0],language,'high');
  assert.equal(valid.kind,'match',language);
 }
});

test('all 84 authored lessons complete sequentially by offline response with durable six-language progress',()=>{
 for(const language of targetLanguages){
  const lessons=lessonsFor(language);
  let state=newCourseProgress(language);
  assert.equal(lessons.length,14);
  for(const lesson of lessons){
   const unlocked=availableLessons(state);
   assert.ok(unlocked.some(item=>item.id===lesson.id),language+' '+lesson.id);
   const next=chooseCourseLesson(state,day);
   assert.equal(next.id,lesson.id,language+' sequence before '+lesson.id);
   const before=state.completed.length;
   const recall=lesson.exercises.find(e=>e.type==='recall');
   const checkpoint=lesson.exercises.find(e=>e.type==='checkpoint');
   const read=checkUtterance(recall,recall.alternatives[0],language,'high');
   assert.equal(read.kind,'match',lesson.id+' recall');
   state=recordCourseAttempt(state,recall,read,day);
   assert.equal(finishLesson(state,lesson).completed.length,before,'recall alone must not pass');
   const checked=checkUtterance(checkpoint,checkpoint.alternatives[0],language,'high');
   assert.equal(checked.kind,'match',lesson.id+' checkpoint');
   state=finishLesson(recordCourseAttempt(state,checkpoint,checked,day),lesson);
   assert.equal(state.completed.length,before+1,lesson.id+' completion');
   const stored=loadCourseState(courseStateToJSON(state),language);
   assert.equal(stored.kind,'ok',lesson.id+' roundtrip');
   state=stored.progress;
  }
  assert.equal(state.completed.length,14);
  assert.equal(new Set(state.completed).size,14);
  assert.equal(chooseCourseLesson(state,day),null,'no phantom lessons after course finished');
 }
});
test('30 directed help-language pairs can traverse 14 authored lessons without localized blank content',()=>{
 for(const [known,target] of learningPairs()){
  const items=lessonsFor(target);
  assert.equal(items.length,14);
  for(const lesson of items){
   assert.ok(lesson.goal[known].trim(),known+' to '+target+' goal');
   assert.ok(lesson.exercises.every(e=>e.meaning[known].trim()),lesson.id+' localized meaning');
   for(const [index,exercise] of lesson.exercises.entries()){
    const next=nextAudioStep(lesson,index,target);
    assert.equal(next.language,target);
    assert.equal(next.speech,exercise.utterance);
    assert.ok(exercise.alternatives.some(a=>matchesAuthoredAnswer(exercise,a,target)));
   }
  }
 }
});
test('listening and imitation cannot write scored evidence even through a forged match event',()=>{
 for(const lang of targetLanguages){
  const lesson=lessonsFor(lang)[0],initial=newCourseProgress(lang);
  for(const item of lesson.exercises.filter(e=>e.type==='listen'||e.type==='repeat')){
   for(const evalResult of [{kind:'match',recognized:item.alternatives[0]},{kind:'retry',hint:'try again'}]){
    assert.equal(recordCourseAttempt(initial,item,evalResult,day),initial,item.id);
   }
  }
  assert.equal(finishLesson(initial,lesson),initial);
 }
});
