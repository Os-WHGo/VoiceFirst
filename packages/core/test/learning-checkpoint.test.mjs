import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as core from '../dist/index.js';

const day='2026-10-30';
function start(checkpoint,known='es',id='test-session'){
 const activities=core.courseActivities(checkpoint.target);
 const state=core.planLearningSession({sessionId:id,target:checkpoint.target,known,today:day,activities,model:checkpoint.model,completedLessons:checkpoint.progress.completed,preferences:core.defaultSessionPreferences});
 return {checkpoint:core.checkpointWithSession(checkpoint,state),activities};
}
function runLesson(ctx){
 let guard=0;
 while(ctx.checkpoint.session.status!=='finished'){
  assert.ok(guard++<30);
  const state=ctx.checkpoint.session,a=ctx.activities.find(a=>a.id===state.current.activityId);
  const event=a.kind==='listen'?{type:'continue'}:a.kind==='choice'?{type:'choose',optionId:a.correctOptionId}:{type:'answer',response:a.model,source:{kind:'typed'}};
  ctx.checkpoint=core.stepLearningCheckpoint(ctx.checkpoint,event,ctx.activities).checkpoint;
 }
 return ctx.checkpoint;
}
test('A0 then A1 sessions complete and survive recovery for all 30 language pairs',()=>{
 for(const [known,target] of core.learningPairs()){
  let checkpoint=core.newLearningCheckpoint(target);
  for(let n=0;n<2;n++){
   checkpoint=runLesson(start(checkpoint,known,`pair-${known}-${target}-${n}`));
   const raw=core.learningCheckpointToJSON(checkpoint);
   const restored=core.learningCheckpointFromJSON(raw,target);
   assert.ok(restored);assert.equal(restored.progress.completed.length,n+1);
   const before=core.learnerModelToJSON(restored.model);
   const applied=core.checkpointWithSession(restored,restored.session);
   assert.equal(core.learnerModelToJSON(applied.model),before,'finished session applies once');
   assert.deepEqual(applied.progress,restored.progress);
   checkpoint=restored;
  }
 }
});
test('all 14 existing micro-lessons are traversable in each target, without invented C2 evidence',()=>{
 for(const target of core.targetLanguages){
  let cp=core.newLearningCheckpoint(target);
  const known=target==='es'?'en-CA':'es';
  for(let n=0;n<core.lessonsFor(target).length;n++)cp=runLesson(start(cp,known,`route-${target}-${n}`));
  assert.equal(cp.progress.completed.length,core.lessonsFor(target).length);
  assert.ok(Object.values(cp.model.records).every(r=>r.skill!=='spoken-production'&&r.skill!=='pronunciation'));
 }
});
test('active sessions restore paused; uncertain speech and names never become persisted transcripts',()=>{
 const ctx=start(core.newLearningCheckpoint('en-CA'));
 ctx.checkpoint=core.stepLearningCheckpoint(ctx.checkpoint,{type:'continue'},ctx.activities).checkpoint;
 let restored=core.learningCheckpointFromJSON(core.learningCheckpointToJSON(ctx.checkpoint),'en-CA');
 assert.equal(restored.session.status,'paused');
 restored=core.stepLearningCheckpoint(restored,{type:'resume',day},ctx.activities).checkpoint;
 const a=ctx.activities.find(a=>a.id===restored.session.current.activityId);
 // Uncertain speech in a choice activity must never select or record an answer.
 const option=a.options.find(o=>o.id===a.correctOptionId);
 const response=typeof option.text==='string'?option.text:option.text.es;
 const next=core.stepLearningCheckpoint(restored,{type:'answer',response,source:{kind:'speech',confidence:'unknown'}},ctx.activities).checkpoint;
 assert.equal(next.session.results.length,restored.session.results.length);
 const raw=core.learningCheckpointToJSON(next);
 assert.equal(raw.includes('received'),false);
 assert.equal(raw.includes('response'),true); // authored response-window preference only
 assert.equal(raw.includes('transcript'),false);
});
test('corrupt, cross-language, stale catalog and broken legacy data fail closed',()=>{
 const initial=core.newLearningCheckpoint('de'),raw=core.learningCheckpointToJSON(initial);
 assert.equal(core.learningCheckpointFromJSON('{','de'),null);
 assert.equal(core.learningCheckpointFromJSON(raw,'it'),null);
 const changed=JSON.parse(raw);changed.catalogSha256='0'.repeat(64);
 assert.equal(core.learningCheckpointFromJSON(JSON.stringify(changed),'de'),null);
 assert.throws(()=>core.newLearningCheckpoint('de','{}'));
 const legacy=core.newCourseProgress('de');
 assert.equal(core.courseStateToJSON(core.newLearningCheckpoint('de',core.courseStateToJSON(legacy)).progress),core.courseStateToJSON(legacy));
});
test('sessions crossing midnight record the current day and never roll back the calendar',()=>{
 const ctx=start(core.newLearningCheckpoint('it'));
 let next=core.stepLearningCheckpoint(ctx.checkpoint,{type:'continue'},ctx.activities,'2026-10-31').checkpoint;
 assert.equal(next.session.results[0].day,'2026-10-31');
 next=core.stepLearningCheckpoint(next,{type:'hint'},ctx.activities,'2026-10-30').checkpoint;
 assert.equal(next.session.lastActiveOn,'2026-10-31');
 assert.throws(()=>core.stepLearningCheckpoint(next,{type:'hint'},ctx.activities,'invalid'));
});
function storageHarness(){
 const values=new Map();let fail=false;
 const storage={async getItem(key){return values.get(key)??null;},async setItem(key,update){if(fail)throw Error('disk full');const next=update(values.get(key)??null);values.set(key,next);}};
 const source=readFileSync(new URL('../../../mobile/learning-checkpoint-storage.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',compiled)(name=>name==='@voicefirst/core'?core:{default:storage},module,module.exports);
 return {api:module.exports,values,setFailure:()=>{fail=true;}};
}
test('actual SQLite adapter rejects stale writes and preserves data on disk failure',async()=>{
 const h=storageHarness(),entry=await h.api.loadLearningCheckpoint('en-CA');
 const ctx=start(entry.checkpoint);
 const raw=await h.api.saveLearningCheckpoint(ctx.checkpoint,null);
 await assert.rejects(h.api.saveLearningCheckpoint(ctx.checkpoint,null));
 const next=core.stepLearningCheckpoint(ctx.checkpoint,{type:'continue'},ctx.activities).checkpoint;
 h.setFailure();await assert.rejects(h.api.saveLearningCheckpoint(next,raw));
 assert.equal(h.values.get(h.api.learningCheckpointKey('en-CA')),raw);
 const resumed=await h.api.loadLearningCheckpoint('en-CA');
 assert.equal(resumed.checkpoint.session.status,'paused');
});
test('legacy progress remains untouched; corrupt existing checkpoints never fall back to empty',async()=>{
 const h=storageHarness(),legacy=core.courseStateToJSON(core.newCourseProgress('it'));
 h.values.set('voicefirst.curriculum.v1.it',legacy);
 const entry=await h.api.loadLearningCheckpoint('it');
 const cp=start(entry.checkpoint,'es').checkpoint;
 await h.api.saveLearningCheckpoint(cp,null);
 assert.equal(h.values.get('voicefirst.curriculum.v1.it'),legacy);
 h.values.set(h.api.learningCheckpointKey('it'),'corrupt');
 await assert.rejects(h.api.loadLearningCheckpoint('it'));
 assert.equal(h.values.get(h.api.learningCheckpointKey('it')),'corrupt');
});

test('foreground microcourse uses SQLite compare-and-write for progress',()=>{
 const code=readFileSync(new URL('../../../mobile/offline-course-storage.ts',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(code,/COURSE_PROGRESS_CONFLICT/);
 assert.match(code,/current!==expected/);
 assert.match(ui,/writeOfflineCourseCAS\(target,expected,raw\)/);
 assert.doesNotMatch(ui,/Storage\.setItem\(storeKey\(target\)/);
});
