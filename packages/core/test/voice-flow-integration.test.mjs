import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,lessonsFor,newCourseProgress,checkUtterance,recordCourseAttempt,finishLesson,
 courseStateToJSON,loadCourseState,chooseCourseLesson,voiceTranscriptDisposition,currentVoiceTurn} from '../dist/index.js';

const day='2026-10-16';
test('offline spoken lesson: safe transcription, confirmed recall, persisted checkpoint and next lesson in all six languages',()=>{
 for(const language of targetLanguages){
  const lesson=lessonsFor(language)[0];
  let progress=newCourseProgress(language);
  const recall=lesson.exercises.find(x=>x.type==='recall');
  const checkpoint=lesson.exercises.find(x=>x.type==='checkpoint');
  assert.ok(recall&&checkpoint);
  const recognized=recall.alternatives[0];
  const disposition=voiceTranscriptDisposition({text:recognized,confidence:'high',answerControl:'wait-for-me',final:true});
  assert.equal(disposition,'confirm');
  assert.equal(progress.attempts[recall.id],undefined,'dictation awaiting learner confirmation does not write progress');
  assert.equal(voiceTranscriptDisposition({text:recognized,confidence:'unknown',answerControl:'auto-after-silence',final:true}),'confirm');
  assert.equal(currentVoiceTurn(lesson.id+':'+recall.id,lesson.id+':'+checkpoint.id,true),false);
  progress=recordCourseAttempt(progress,recall,checkUtterance(recall,recognized,language,'high'),day);
  assert.deepEqual(progress.completed,[]);
  const restored=loadCourseState(courseStateToJSON(progress),language);
  assert.equal(restored.kind,'ok');
  if(restored.kind!=='ok')continue;
  progress=restored.progress;
  progress=recordCourseAttempt(progress,checkpoint,checkUtterance(checkpoint,checkpoint.alternatives[0],language,'high'),day);
  progress=finishLesson(progress,lesson);
  assert.ok(progress.completed.includes(lesson.id));
  assert.equal(chooseCourseLesson(progress,day)?.id,lessonsFor(language)[1].id);
 }
});
test('no score is awarded to uncertain or semantically unmatched speech until the student chooses a retry',()=>{
 const lesson=lessonsFor('en-CA')[0];const recall=lesson.exercises[2];
 const start=newCourseProgress('en-CA');
 assert.equal(voiceTranscriptDisposition({text:recall.utterance,confidence:'unknown',answerControl:'auto-after-silence',final:true}),'confirm');
 const uncertain=checkUtterance(recall,recall.utterance,'en-CA','low');
 assert.equal(recordCourseAttempt(start,recall,uncertain,day),start);
 const mismatch=checkUtterance(recall,'unrelated text','en-CA','high');
 assert.equal(mismatch.kind,'retry');
 const p=recordCourseAttempt(start,recall,mismatch,day);
 assert.equal(p.completed.length,0);
 assert.equal(p.correct[recall.id],0);
});

test('voice policy refuses interim, blank, stale and disabled turns',()=>{
 const id='en-CA:lesson-1:recall';
 for(const text of ['', '   ', null, 123]){
  assert.equal(voiceTranscriptDisposition({text,confidence:'high',answerControl:'auto-after-silence',final:true}),'ignore');
 }
 assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'high',answerControl:'auto-after-silence',final:false}),'ignore');
 assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'high',answerControl:'auto-after-silence',final:true}),'evaluate');
 assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'unknown',answerControl:'auto-after-silence',final:true}),'confirm');
 assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'high',answerControl:'wait-for-me',final:true}),'confirm');
 assert.equal(currentVoiceTurn(id,id,true),true);
 assert.equal(currentVoiceTurn(id,id,false),false);
 assert.equal(currentVoiceTurn(null,id,true),false);
 assert.equal(currentVoiceTurn(id,'fr-CA:lesson-1:recall',true),false);
});
