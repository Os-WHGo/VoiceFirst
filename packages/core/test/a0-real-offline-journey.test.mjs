/** Full offline A0 learning journey using the real authored catalog and injected storage. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadA0CandidateCatalog,restoreA0Session,commitA0Attempt,nextA0LessonId,a0JournalProgress} from '../dist/index.js';

const source=JSON.parse(readFileSync(fileURLToPath(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url)),'utf8'));
const catalog=loadA0CandidateCatalog(source);
assert.equal(catalog.kind,'candidate',JSON.stringify(catalog.issues));

for(const target of ['en-CA','fr-CA','es','pt-BR','de','it']){
 test('real A0 offline progress, restart, retry and isolation: '+target,async()=>{
  const saved=new Map();
  const port={read:async key=>saved.get(key)??null,write:async(key,value)=>{saved.set(key,value)}};
  const lessons=catalog.lessons.filter(l=>l.targetLanguage===target);
  let loaded=await restoreA0Session(port,target,lessons);
  assert.equal(loaded.kind,'ok');
  let journal=loaded.journal;
  assert.equal(nextA0LessonId(lessons,journal),lessons[0].lessonId);
  const first=lessons[0];
  const wrong=first.options.find(x=>x.id!==first.correctOptionId);
  assert.ok(wrong);
  journal=await commitA0Attempt(port,journal,first,{eventId:'test.wrong.'+target,lessonId:first.lessonId,selectedOptionId:wrong.id,attemptNumber:1});
  assert.equal(journal.revision,1);
  assert.equal(nextA0LessonId(lessons,journal),first.lessonId);
  loaded=await restoreA0Session(port,target,lessons);
  assert.equal(loaded.kind,'ok');
  journal=loaded.journal;
  assert.equal(journal.events.length,1);
  journal=await commitA0Attempt(port,journal,first,{eventId:'test.correct.'+target,lessonId:first.lessonId,selectedOptionId:first.correctOptionId,attemptNumber:2});
  assert.equal(journal.revision,2);
  assert.equal(nextA0LessonId(lessons,journal),lessons[1].lessonId);
  const duplicate=await commitA0Attempt(port,journal,first,{eventId:'test.after.'+target,lessonId:first.lessonId,selectedOptionId:first.correctOptionId,attemptNumber:3});
  assert.equal(duplicate.revision,2);
  for(let i=1;i<lessons.length;i++){
   const lesson=lessons[i];
   assert.equal(nextA0LessonId(lessons,journal),lesson.lessonId);
   journal=await commitA0Attempt(port,journal,lesson,{eventId:'test.'+target+'.'+i,lessonId:lesson.lessonId,selectedOptionId:lesson.correctOptionId,attemptNumber:1});
   assert.equal(journal.revision,i+2);
  }
  assert.equal(nextA0LessonId(lessons,journal),null);
  assert.equal(a0JournalProgress(journal,lessons).completedLessonIds.length,6);
  const restart=await restoreA0Session(port,target,lessons);
  assert.equal(restart.kind,'ok');
  assert.equal(restart.journal.revision,7);
  assert.equal(a0JournalProgress(restart.journal,lessons).completedLessonIds.length,6);
  const another=['en-CA','fr-CA','es','pt-BR','de','it'].find(x=>x!==target);
  const separate=await restoreA0Session(port,another,catalog.lessons);
  assert.equal(separate.kind,'ok');
  assert.equal(separate.journal.events.length,0);
 });
}
test('A0 storage failure never claims a successful answer',async()=>{
 const first=catalog.lessons[0];
 const port={read:async()=>null,write:async()=>{throw new Error('disk full')}};
 const initial=await restoreA0Session(port,first.targetLanguage,[first]);
 assert.equal(initial.kind,'ok');
 await assert.rejects(()=>commitA0Attempt(port,initial.journal,first,{eventId:'write.fail',lessonId:first.lessonId,selectedOptionId:first.correctOptionId,attemptNumber:1}),/disk full/);
 assert.equal(initial.journal.revision,0);
});

test('corrupted stored A0 progress is not overwritten or silently reset',async()=>{
 const lesson=catalog.lessons[0];
 const key='voicefirst.a0.journal.v1.'+lesson.targetLanguage;
 const saved=new Map([[key,'{broken-json']]);
 const port={read:async k=>saved.get(k)??null,write:async(k,v)=>{saved.set(k,v)}};
 const restored=await restoreA0Session(port,lesson.targetLanguage,[lesson]);
 assert.equal(restored.kind,'invalid');
 assert.equal(saved.get(key),'{broken-json');
});
test('failed A0 write preserves the previous valid journal for recovery',async()=>{
 const lesson=catalog.lessons[0];
 const key='voicefirst.a0.journal.v1.'+lesson.targetLanguage;
 const saved=new Map();
 let fail=false;
 const port={read:async k=>saved.get(k)??null,write:async(k,v)=>{if(fail)throw new Error('simulated write failure');saved.set(k,v)}};
 const initial=await restoreA0Session(port,lesson.targetLanguage,[lesson]);
 assert.equal(initial.kind,'ok');
 const first=await commitA0Attempt(port,initial.journal,lesson,{eventId:'persist.first',lessonId:lesson.lessonId,selectedOptionId:lesson.options.find(x=>x.id!==lesson.correctOptionId).id,attemptNumber:1});
 assert.equal(first.revision,1);
 const original=saved.get(key);
 fail=true;
 await assert.rejects(()=>commitA0Attempt(port,first,lesson,{eventId:'persist.second',lessonId:lesson.lessonId,selectedOptionId:lesson.correctOptionId,attemptNumber:2}),/simulated write failure/);
 assert.equal(saved.get(key),original);
 const recovered=await restoreA0Session(port,lesson.targetLanguage,[lesson]);
 assert.equal(recovered.kind,'ok');
 assert.equal(recovered.journal.revision,1);
});
