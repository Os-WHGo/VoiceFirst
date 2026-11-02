import test from 'node:test';
import assert from 'node:assert/strict';
import {selectPracticePhrase,authoredPhrasesForIntent} from '../dist/index.js';
test('offline authored phrase rotation covers six locales',()=>{
 for(const locale of ['en-CA','fr-CA','es','pt-BR','de','it']){
  const options=authoredPhrasesForIntent(locale,'request-water');
  assert.ok(options.length>=2);
  assert.equal(selectPracticePhrase(locale,'request-water',0),options[0]);
  assert.equal(selectPracticePhrase(locale,'request-water',options.length),options[0]);
  assert.equal(selectPracticePhrase(locale,'request-water',1),options[1]);
 }
});
test('rejects invalid attempt indexes and unsupported intent',()=>{
 assert.equal(selectPracticePhrase('en-CA','greeting',-1),undefined);
 assert.equal(selectPracticePhrase('en-CA','greeting',NaN),undefined);
 assert.equal(selectPracticePhrase('en-CA','request-help',0),undefined);
});
