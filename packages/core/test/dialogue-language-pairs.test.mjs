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
