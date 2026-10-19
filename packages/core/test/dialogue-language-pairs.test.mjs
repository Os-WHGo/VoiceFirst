import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,dialoguesFor,dialogueAudioCue,evaluateDialogueTurn,newDialogueRun,recordDialogueResponse,selectGuidedDialogues} from '../dist/index.js';
test('all 30 directed language pairs have independently localized dialogue support',()=>{
 let count=0;
 for(const known of targetLanguages)for(const target of targetLanguages){
  if(known===target)continue;
  count++;
  for(const dialogue of dialoguesFor(target)){
   for(let index=0;index<dialogue.turns.length;index++){
    const cue=dialogueAudioCue(dialogue,index,known,true);
    assert.equal(cue.language,known);
    assert.ok(cue.text.trim().length>0);
    const targetCue=dialogueAudioCue(dialogue,index,known,false);
    assert.equal(targetCue.language,target);
    assert.ok(targetCue.text.trim().length>0);
   }
  }
 }
 assert.equal(count,30);
});
test('every curated dialogue can complete with its own authored responses',()=>{
 for(const target of targetLanguages)for(const dialogue of dialoguesFor(target)){
  let run=newDialogueRun(dialogue);
  for(const turn of dialogue.turns){
   const attempt=evaluateDialogueTurn(turn,turn.acceptedReplies[0],target,'high');
   assert.equal(attempt.verdict,'accepted');
   run=recordDialogueResponse(run,dialogue,attempt);
  }
  assert.equal(run.completed,true);
  assert.equal(run.turnIndex,dialogue.turns.length);
 }
});
test('uncertain recognition never advances a dialogue and minors remain gated',()=>{
 for(const target of targetLanguages){
  const dialogue=dialoguesFor(target)[0],turn=dialogue.turns[0];
  const attempt=evaluateDialogueTurn(turn,turn.acceptedReplies[0],target,'unknown');
  assert.equal(recordDialogueResponse(newDialogueRun(dialogue),dialogue,attempt).turnIndex,0);
  assert.equal(selectGuidedDialogues(target,'balanced','adult').status,'available');
 }
});

test('every accepted authored reply is recognized across six targets',()=>{
 for(const target of targetLanguages)for(const dialogue of dialoguesFor(target))for(const turn of dialogue.turns){
  for(const reply of turn.acceptedReplies){
   assert.equal(evaluateDialogueTurn(turn,reply,target,'high').verdict,'accepted',`${target}: ${reply}`);
  }
 }
});

test('all six targets include the two-turn shopping conversation',()=>{
 for(const target of targetLanguages){
  const dialogues=dialoguesFor(target);
  assert.equal(dialogues.length,4);
  const shopping=dialogues.find(d=>d.domain==='shopping');
  assert.ok(shopping);
  assert.equal(shopping.turns.length,2);
  assert.deepEqual(shopping.turns.map(t=>t.intent),['ask-price','ask-card-payment']);
  assert.ok(shopping.turns.every(t=>t.acceptedReplies.length>=2));
 }
});

test('minor profiles never receive guided dialogues',()=>{
 for(const target of targetLanguages)for(const age of ['preschool','primary','preteen','teen']){
  const result=selectGuidedDialogues(target,'balanced',age);
  assert.equal(result.status,'requires-child-safety-review');
  assert.equal(result.dialogues.length,0);
 }
});

test('wrong replies do not skip a dialogue turn',()=>{
 for(const target of targetLanguages)for(const dialogue of dialoguesFor(target)){
  const run=newDialogueRun(dialogue);
  const attempt=evaluateDialogueTurn(dialogue.turns[0],'not a curated reply',target,'high');
  assert.equal(attempt.verdict,'retry');
  const next=recordDialogueResponse(run,dialogue,attempt);
  assert.equal(next.turnIndex,0);
  assert.equal(next.completed,false);
  assert.equal(next.attempts[dialogue.turns[0].id],1);
 }
});

test('forged accepted verdict cannot skip a curated turn',()=>{
 for(const target of targetLanguages)for(const dialogue of dialoguesFor(target)){
  const initial=newDialogueRun(dialogue);
  assert.deepEqual(recordDialogueResponse(initial,dialogue,{verdict:'accepted'}),initial);
  assert.deepEqual(recordDialogueResponse(initial,dialogue,{verdict:'accepted',matchedReply:'unrelated phrase'}),initial);
  const real=evaluateDialogueTurn(dialogue.turns[0],dialogue.turns[0].acceptedReplies[0],target,'high');
  const advanced=recordDialogueResponse(initial,dialogue,real);
  assert.equal(advanced.turnIndex,1);
  assert.deepEqual(recordDialogueResponse(advanced,dialogue,real),advanced);
 }
});
