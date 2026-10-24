import test from 'node:test';
import assert from 'node:assert/strict';
import {voiceTranscriptDisposition,currentVoiceTurn} from '../dist/index.js';

test('default learner-controlled recognition never automatically grades a dictated utterance',()=>{
 assert.equal(voiceTranscriptDisposition({text:'Can I help?',confidence:'high',answerControl:'wait-for-me',final:true}),'confirm');
 assert.equal(voiceTranscriptDisposition({text:'Can I help?',confidence:'high',answerControl:'auto-after-silence',final:true}),'evaluate');
});
test('uncertain, missing and partial ASR are never auto-scored',()=>{
 for(const ctrl of ['wait-for-me','auto-after-silence']){
  assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'unknown',answerControl:ctrl,final:true}),'confirm');
  assert.equal(voiceTranscriptDisposition({text:'hello',confidence:'high',answerControl:ctrl,final:false}),'ignore');
  for(const empty of ['',null,undefined,'   '])assert.equal(voiceTranscriptDisposition({text:empty,confidence:'high',answerControl:ctrl,final:true}),'ignore');
 }
});
test('late or unrelated recognition cannot affect another exercise',()=>{
 assert.equal(currentVoiceTurn('lesson:step1','lesson:step2',true),false);
 assert.equal(currentVoiceTurn('lesson:step1','lesson:step1',false),false);
 assert.equal(currentVoiceTurn(null,'lesson:step1',true),false);
 assert.equal(currentVoiceTurn('lesson:step1','lesson:step1',true),true);
});
