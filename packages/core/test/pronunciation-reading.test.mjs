import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pronunciationReadingFor,prototypePronunciationReadings,lessonsFor,targetLanguages,learningPairs} from '../dist/index.js';

test('pilot readings are per exact target and learner language, not fake 30-pair coverage',()=>{
 assert.equal(prototypePronunciationReadings.length,4);
 assert.equal(learningPairs().length,30);
 for(const item of prototypePronunciationReadings){
  assert.ok(targetLanguages.includes(item.target));
  assert.ok(targetLanguages.includes(item.known));
  assert.notEqual(item.target,item.known);
  assert.equal(item.status,'prototype-unreviewed');
  assert.equal(item.attribution,'voicefirst-original');
  assert.ok(item.reading.length>2);
  assert.ok(item.stressAndArticulation.length>15);
  assert.ok(lessonsFor(item.target).some(l=>l.exercises.some(e=>e.utterance===item.phrase)));
  assert.deepEqual(pronunciationReadingFor(item.phrase,item.target,item.known,item.targetLocale),item);
 }
 assert.equal(new Set(prototypePronunciationReadings.map(g=>[g.target,g.known,g.targetLocale,g.phrase].join('|'))).size,prototypePronunciationReadings.length);
});

test('unsupported locales, learners and altered utterances fail closed without guesses',()=>{
 assert.equal(pronunciationReadingFor('Hello!','en-CA','fr-CA'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','en-CA'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','es','en-US'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','es','en-GB'),null);
 assert.equal(pronunciationReadingFor('Bonjour!','fr-CA','es'),null);
 assert.equal(pronunciationReadingFor('Hello there!','en-CA','es'),null);
 assert.equal(pronunciationReadingFor('Hi!','en-CA','es'),null);
 assert.equal(pronunciationReadingFor(' ','en-CA','es'),null);
});

test('orthographic normalization is safe but does not generate or score speech',()=>{
 assert.equal(pronunciationReadingFor('  ¡Hola!  ','es','en-CA')?.reading,'OH-lah');
 assert.equal(pronunciationReadingFor('hola','es','en-CA'),null);
 assert.equal(pronunciationReadingFor('Olá!','pt-BR','es')?.reading,'o-LÁ');
 assert.equal(pronunciationReadingFor('Olá!','pt-BR','en-CA'),null);
});

test('UI limits phonetic drafts to voluntary listening/repeating; recall has no answer leak',()=>{
 const source=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(source,/pronunciationReadingFor\(current\.utterance,target,nativeLanguage\)/);
 assert.match(source,/current\.type==='listen'\|\|current\.type==='repeat'/);
 assert.match(source,/setShowReading\(false\)/);
 assert.match(source,/pendiente de revisión/i);
});
