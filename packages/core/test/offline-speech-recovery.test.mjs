import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineSpeechFailure} from '../dist/index.js';

test('on-device speech failures allow recovery but never score a learner',()=>{
 const cases=[
  ['no-speech','retry'],['speech-timeout','retry'],['language-not-supported','check-model'],
  ['not-allowed','permission'],['busy','wait'],['too-many-requests','wait'],
  ['interrupted','wait'],['audio-capture','wait'],['network','text'],
  ['service-not-allowed','text'],['aborted','none']
 ];
 for(const [error,recovery] of cases){
  const result=offlineSpeechFailure({error,message:'UNTRUSTED NATIVE MESSAGE'});
  assert.equal(result.recovery,recovery,error);
  assert.equal(typeof result.message,'string',error);
  assert.ok(!result.message.includes('UNTRUSTED'),error);
  assert.equal('answer' in result,false);
  assert.equal('score' in result,false);
 }
});
test('malformed events fail closed and cannot claim a recognized or installed language',()=>{
 for(const event of [null,undefined,0,'no-speech',[],{}, {error:42},{error:'unknown'}]){
  assert.equal(offlineSpeechFailure(event).recovery,'text');
 }
 assert.deepEqual(offlineSpeechFailure({error:'aborted'}),{recovery:'none',message:''});
});
