import test from 'node:test';
import assert from 'node:assert/strict';
import {dialoguesFor,selectGuidedDialogues,newLearningProgress,getSavedDialogueRun,saveDialogueAttempt,chooseDialogue,
  startDialogueReview,serializeLearningProgress,deserializeLearningProgress,makeProgressWriter} from '../dist/index.js';
const d=dialoguesFor('en-CA');const work=d.find(x=>x.domain==='work');
const today='2026-10-16';
function complete(p,dialogue,day){for(const turn of dialogue.turns)p=saveDialogueAttempt(p,dialogue,{verdict:'accepted',matchedReply:turn.acceptedReplies[0]},day);return p;}
test('progress records no audio transcripts and resumes precisely after first answer',()=>{
 let p=newLearningProgress('en-CA');p=saveDialogueAttempt(p,work,{verdict:'accepted',matchedReply:'Can I help you?'},today);
 const raw=serializeLearningProgress(p);assert.ok(!raw.includes('Can I help you?'));
 const hydrated=deserializeLearningProgress(raw,'en-CA',d);assert.equal(hydrated.kind,'ok');
 assert.equal(getSavedDialogueRun(hydrated.progress,work).turnIndex,1);
});
test('uncertain speech never advances or writes progress',()=>{
 const p=newLearningProgress('en-CA');const next=saveDialogueAttempt(p,work,{verdict:'uncertain'},today);
 assert.equal(next,p);
});
test('retry counts attempt but never advances turn',()=>{
 let p=newLearningProgress('en-CA');p=saveDialogueAttempt(p,work,{verdict:'retry'},today);
 assert.equal(getSavedDialogueRun(p,work).turnIndex,0);assert.equal(p.dialogues[work.id].completions,0);
});
test('complete, due date, review restart and progressively spaced schedule',()=>{
 let p=complete(newLearningProgress('en-CA'),work,today);
 assert.equal(p.dialogues[work.id].reviewDueOn,'2026-10-17');
 assert.equal(p.dialogues[work.id].completions,1);
 p=startDialogueReview(p,work);assert.equal(p.dialogues[work.id].completions,1);
 p=complete(p,work,'2026-10-17');assert.equal(p.dialogues[work.id].reviewDueOn,'2026-10-20');
 assert.equal(p.dialogues[work.id].completions,2);
});
test('a completed overdue review outranks focus ordering',()=>{
 const order=selectGuidedDialogues('en-CA','travel','adult').dialogues;
 let p=complete(newLearningProgress('en-CA'),work,today);
 assert.equal(chooseDialogue(p,order,'2026-10-18')?.id,work.id);
 assert.equal(chooseDialogue(p,order,'2026-10-16')?.domain,'travel');
});
test('cross-language tampering and future schemas are rejected explicitly',()=>{
 const p=newLearningProgress('en-CA');
 assert.equal(deserializeLearningProgress(serializeLearningProgress(p),'de',dialoguesFor('de')).kind,'corrupt');
 assert.equal(deserializeLearningProgress('{"schemaVersion":99}', 'en-CA',d).kind,'unsupported-version');
});
test('malformed, oversized, impossible checkpoints and prototype pollution keys rejected',()=>{
 const p=complete(newLearningProgress('en-CA'),work,today);let obj=JSON.parse(serializeLearningProgress(p));
 obj.dialogues[work.id].run.turnIndex=99;
 assert.equal(deserializeLearningProgress(JSON.stringify(obj),'en-CA',d).kind,'corrupt');
 assert.equal(deserializeLearningProgress('x'.repeat(200001),'en-CA',d).kind,'corrupt');
 assert.equal(deserializeLearningProgress('{not json}','en-CA',d).kind,'corrupt');
});
test('valid days and languages enforced at trust boundary',()=>{
 assert.throws(()=>saveDialogueAttempt(newLearningProgress('en-CA'),work,{verdict:'retry'},'2026-02-30'),/Invalid local day/);
 assert.throws(()=>getSavedDialogueRun(newLearningProgress('de'),work),/Language mismatch/);
});
test('writes remain ordered when storage resolves asynchronously',async()=>{
 const written=[];const write=makeProgressWriter(async raw=>{await new Promise(r=>setTimeout(r,4));written.push(JSON.parse(raw).revision);});
 const p=newLearningProgress('en-CA');await Promise.all([write({...p,revision:1}),write({...p,revision:2}),write({...p,revision:3})]);
 assert.deepEqual(written,[1,2,3]);await write({...p,revision:1});assert.deepEqual(written,[1,2,3]);
});
