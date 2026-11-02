import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceCommand} from '../dist/index.js';

const cases=[
 ['apenas ouvir','ONLY_LISTEN'],['nur zuhören','ONLY_LISTEN'],['solo ascoltare','ONLY_LISTEN'],
 ['mais rápido','FASTER'],['schneller bitte','FASTER'],['più veloce','FASTER'],
 ['comece de novo','REPEAT'],['noch einmal','REPEAT'],['ancora una volta','REPEAT'],
 ['explica em português','EXPLAIN_IN','pt-BR'],
 ['erklär es auf deutsch','EXPLAIN_IN','de'],
 ['spiegami in italiano','EXPLAIN_IN','it']
];
test('offline commands cover listening-only, pace and repetition in three additional languages',()=>{
 for(const [spoken,type,language] of cases){
  const command=parseVoiceCommand(spoken);
  assert.equal(command?.type,type,spoken);
  if(language)assert.equal(command.language,language,spoken);
 }
});
test('exact command parser does not execute quoted commands or incidental speech',()=>{
 for(const phrase of ['I said pause','he said nur zuhören','she asked mais rápido','repeat that phrase tomorrow']){
  assert.equal(parseVoiceCommand(phrase),null,phrase);
 }
});
