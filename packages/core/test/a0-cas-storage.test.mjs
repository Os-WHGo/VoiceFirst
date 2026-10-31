/** Actual mobile SQLite adapter with deterministic transaction boundaries; not device SQLite. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {loadA0CandidateCatalog,restoreA0Session,commitA0Attempt,newA0Journal,a0JournalProgress} from '../dist/index.js';
const catalog=loadA0CandidateCatalog(JSON.parse(readFileSync(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url),'utf8')));
assert.equal(catalog.kind,'candidate');
function harness(){
 const values=new Map();let writes=0,fail=false;
 const native={async getItem(key){return values.get(key)??null;},async setItem(key,update){
  assert.equal(typeof update,'function','device writes must use the exclusive transactional updater');
  writes++;if(fail)throw Error('disk full');
  const next=update(values.get(key)??null);values.set(key,next);
 }};
 const source=readFileSync(new URL('../../../mobile/a0-device-storage.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(()=>({default:native}),module,module.exports);
 return {port:module.exports.a0DeviceStorage,values,writes:()=>writes,fail:()=>{fail=true;}};
}
const event=(lesson,id,attemptNumber=1,correct=true)=>({eventId:id,lessonId:lesson.lessonId,selectedOptionId:correct?lesson.correctOptionId:lesson.options.find(o=>o.id!==lesson.correctOptionId).id,attemptNumber});
test('two restored A0 instances cannot overwrite each other; the committed writer survives',async()=>{
 const h=harness(),lesson=catalog.lessons[0];
 const first=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons),second=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 const saved=await commitA0Attempt(h.port,first.journal,lesson,event(lesson,'first'),first.raw);
 const before=[...h.values.values()][0];
 await assert.rejects(commitA0Attempt(h.port,second.journal,lesson,event(lesson,'stale'),second.raw),/A0_STORAGE_CONFLICT/);
 assert.equal([...h.values.values()][0],before);
 const read=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 assert.deepEqual(read.journal,saved);assert.equal(read.journal.events[0].eventId,'first');
});
test('all 36 actual candidate lessons can commit/restart through the native CAS adapter',async()=>{
 const h=harness();
 for(const target of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const lessons=catalog.lessons.filter(l=>l.targetLanguage===target);
  for(const lesson of lessons){
   const restored=await restoreA0Session(h.port,target,lessons);
   const next=await commitA0Attempt(h.port,restored.journal,lesson,event(lesson,`cas-${lesson.lessonId}`),restored.raw);
   const again=await restoreA0Session(h.port,target,lessons);
   assert.deepEqual(again.journal,next);
  }
  const read=await restoreA0Session(h.port,target,lessons);
  assert.equal(a0JournalProgress(read.journal,lessons).completedLessonIds.length,6);
 }
 assert.equal(h.values.size,6);assert.equal(h.writes(),36);
});
test('legacy v1 pretty-printed JSON uses its exact prior bytes without a schema reset',async()=>{
 const h=harness(),lesson=catalog.lessons[0],key=`voicefirst.a0.journal.v1.${lesson.targetLanguage}`;
 const prior=JSON.stringify(newA0Journal(lesson.targetLanguage),null,2);h.values.set(key,prior);
 const read=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 assert.equal(read.raw,prior);
 const saved=await commitA0Attempt(h.port,read.journal,lesson,event(lesson,'legacy'),read.raw);
 assert.equal(saved.schemaVersion,1);assert.equal(saved.revision,1);
});
test('a CAS-capable device port requires the actual matching snapshot and never falls back to a blind write',async()=>{
 const h=harness(),lesson=catalog.lessons[0],journal=newA0Journal(lesson.targetLanguage);
 await assert.rejects(commitA0Attempt(h.port,journal,lesson,event(lesson,'missing')),/A0_SNAPSHOT_REQUIRED/);
 await assert.rejects(commitA0Attempt(h.port,journal,lesson,event(lesson,'different'),JSON.stringify({...journal,revision:1})),/A0_SNAPSHOT_MISMATCH/);
 assert.equal(h.writes(),0);
});
test('unknown stored metadata and corrupt input are preserved rather than silently overwritten',async()=>{
 const h=harness(),lesson=catalog.lessons[0],key=`voicefirst.a0.journal.v1.${lesson.targetLanguage}`;
 const prior=JSON.stringify({...newA0Journal(lesson.targetLanguage),futureMetadata:'preserve'});h.values.set(key,prior);
 const read=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 await assert.rejects(commitA0Attempt(h.port,read.journal,lesson,event(lesson,'future'),read.raw),/A0_SNAPSHOT_MISMATCH/);
 assert.equal(h.values.get(key),prior);
 h.values.set(key,'bad JSON');assert.equal((await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons)).kind,'invalid');
 assert.equal(h.values.get(key),'bad JSON');
});
test('disk failure cannot report A0 progress or alter the last snapshot',async()=>{
 const h=harness(),lesson=catalog.lessons[0];
 const first=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 await commitA0Attempt(h.port,first.journal,lesson,event(lesson,'wrong',1,false),first.raw);
 const before=[...h.values.values()][0],read=await restoreA0Session(h.port,lesson.targetLanguage,catalog.lessons);
 h.fail();await assert.rejects(commitA0Attempt(h.port,read.journal,lesson,event(lesson,'correct',2),read.raw),/disk full/);
 assert.equal([...h.values.values()][0],before);assert.equal(read.journal.events.length,1);
});
