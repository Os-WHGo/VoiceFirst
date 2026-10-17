import test from 'node:test';
import assert from 'node:assert/strict';
import {dialoguesFor,newLearningProgress,nextTutorPrompt,applyTutorAttempt} from '../dist/index.js';

test('offline tutor guides a dialogue, retries, then resumes from saved progress',()=>{
 const dialogue=dialoguesFor('en-CA')[0];
 let progress=newLearningProgress('en-CA');
 const prompt=nextTutorPrompt(progress,dialogue,'es',true);
 assert.equal(prompt.status,'prompt');
 assert.equal(prompt.language,'es');
 const unclear=applyTutorAttempt(progress,dialogue,'es',{verdict:'uncertain'},'2026-10-17');
 assert.equal(unclear.action,'confirm-hearing');
 assert.equal(unclear.progress,progress);
 const retry=applyTutorAttempt(progress,dialogue,'es',{verdict:'retry'},'2026-10-17');
 assert.equal(retry.action,'ask-again');
 progress=retry.progress;
 const hint=applyTutorAttempt(progress,dialogue,'es',{verdict:'retry'},'2026-10-17');
 assert.equal(hint.action,'offer-hint');
 assert.equal(hint.example,dialogue.turns[0].acceptedReplies[0]);
 progress=hint.progress;
 const accepted=applyTutorAttempt(progress,dialogue,'es',{verdict:'accepted'},'2026-10-17');
 assert.equal(accepted.action,'advance');
 progress=accepted.progress;
 assert.equal(nextTutorPrompt(progress,dialogue,'es').turnId,dialogue.turns[1].id);
 const last=applyTutorAttempt(progress,dialogue,'es',{verdict:'accepted'},'2026-10-17');
 assert.equal(nextTutorPrompt(last.progress,dialogue,'es').status,'complete');
});
