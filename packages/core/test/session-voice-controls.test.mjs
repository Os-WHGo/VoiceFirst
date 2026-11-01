import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSessionVoiceCommand,fasterSessionPlaybackRate,parseVoiceCommand} from '../dist/index.js';

test('voice navigation dispatches only explicit learner-confirmed course events',()=>{
 const cases=[
  ['STOP','finish'],['PAUSE','pause'],['REPEAT','replay'],['SLOWER','slower'],
  ['HELP','hint'],['NEXT','skip']
 ];
 for(const [type,event] of cases){
  assert.deepEqual(resolveSessionVoiceCommand({type},'active','2026-10-31'),{kind:'event',event:{type:event}},type);
 }
 assert.deepEqual(resolveSessionVoiceCommand({type:'RESUME'},'paused','2026-10-31'),
  {kind:'event',event:{type:'resume',day:'2026-10-31'}});
});
test('listen-only, faster playback and summary never create learning events',()=>{
 for(const [type,kind] of [['ONLY_LISTEN','play-current'],['FASTER','speed-up'],['SUMMARY','play-summary']]){
  assert.deepEqual(resolveSessionVoiceCommand({type},'active','2026-10-31'),{kind});
 }
});
test('out-of-state and language-switch commands cannot become unintended skip/continue',()=>{
 for(const type of ['RESUME','TARGET','EXPLAIN_IN']){
  const command=type==='TARGET'||type==='EXPLAIN_IN'?{type,language:'fr-CA'}:{type};
  assert.deepEqual(resolveSessionVoiceCommand(command,'active','2026-10-31'),{kind:'unsupported'});
 }
 for(const type of ['NEXT','REPEAT','HELP','SLOWER','FASTER','ONLY_LISTEN','PAUSE']){
  assert.deepEqual(resolveSessionVoiceCommand({type},'paused','2026-10-31'),{kind:'unsupported'},type);
 }
 assert.deepEqual(resolveSessionVoiceCommand({type:'STOP'},'finished','2026-10-31'),{kind:'unsupported'});
 assert.deepEqual(resolveSessionVoiceCommand({type:'RESUME'},'finished','2026-10-31'),{kind:'unsupported'});
});
test('speech parser and controller recognize six-language listen-only navigation safely',()=>{
 for(const phrase of ['solo escuchar','just listen','écouter seulement','apenas ouvir','nur zuhören','solo ascoltare']){
  const command=parseVoiceCommand(phrase);
  assert.equal(command?.type,'ONLY_LISTEN',phrase);
  assert.deepEqual(resolveSessionVoiceCommand(command,'active','2026-10-31'),{kind:'play-current'},phrase);
 }
});
test('fast playback is bounded to existing safe engine rates',()=>{
 assert.equal(fasterSessionPlaybackRate(0.88),0.98);
 assert.equal(fasterSessionPlaybackRate(1.17),1.2);
 assert.equal(fasterSessionPlaybackRate(1.2),1.2);
 assert.equal(fasterSessionPlaybackRate(0.65),0.75);
 assert.equal(fasterSessionPlaybackRate(Number.NaN),1.1);
});

test('explicit full-phrase confirmation and rejection work in all six known languages',()=>{
 const utterances=[
  ['confirmar mi respuesta','rechazar mi respuesta'],
  ['confirm my answer','reject my answer'],
  ['confirmer ma réponse','refuser ma réponse'],
  ['confirmar minha resposta','rejeitar minha resposta'],
  ['Antwort bestätigen','Antwort ablehnen'],
  ['conferma la mia risposta','rifiuta la mia risposta'],
 ];
 for(const [accept,reject] of utterances){
  assert.deepEqual(parseVoiceCommand(accept),{type:'CONFIRM_ANSWER'},accept);
  assert.deepEqual(parseVoiceCommand(reject),{type:'REJECT_ANSWER'},reject);
  assert.deepEqual(resolveSessionVoiceCommand(parseVoiceCommand(accept),'active','2026-10-31',true),
    {kind:'event',event:{type:'confirm'}},accept);
  assert.deepEqual(resolveSessionVoiceCommand(parseVoiceCommand(reject),'active','2026-10-31',true),
    {kind:'event',event:{type:'reject'}},reject);
 }
});
test('confirmation commands are inapplicable without a matching pending answer or while paused',()=>{
 for(const type of ['CONFIRM_ANSWER','REJECT_ANSWER']){
  for(const [status,pending] of [['active',false],['paused',true],['finished',true],['finished',false]]){
   assert.deepEqual(resolveSessionVoiceCommand({type},status,'2026-10-31',pending),
    {kind:'unsupported'},type+' '+status+' '+pending);
  }
 }
 for(const phrase of ['yes','sí','no','I said confirm my answer','she said rechazar mi respuesta']){
  assert.equal(parseVoiceCommand(phrase),null,phrase);
 }
});
