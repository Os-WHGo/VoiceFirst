import test from 'node:test';
import assert from 'node:assert/strict';
import {numberWords,numberListeningPrompt,checkNumberAnswer} from '../dist/number-listening.js';
test('English teens and tens are distinguishable',()=>{
 assert.equal(numberWords(15,'en-CA'),'fifteen');
 assert.equal(numberWords(50,'en-CA'),'fifty');
 assert.deepEqual(numberListeningPrompt(15,'en-CA').confusableWith,[50]);
});
test('French complex numbers have canonical France/Canada reference forms',()=>{
 assert.equal(numberWords(71,'fr-CA'),'soixante et onze');
 assert.equal(numberWords(80,'fr-CA'),'quatre-vingts');
 assert.equal(numberWords(81,'fr-CA'),'quatre-vingt-un');
 assert.equal(numberWords(97,'fr-CA'),'quatre-vingt-dix-sept');
});
test('all number seeds in range can be rendered',()=>{
 for(const lang of ['en-CA','fr-CA'])for(let i=0;i<100;i++)assert.ok(numberWords(i,lang));
 assert.throws(()=>numberWords(100,'fr-CA'),RangeError);
});
test('number response does not claim to grade pronunciation',()=>{
 assert.equal(checkNumberAnswer('50',50),'match');
 assert.equal(checkNumberAnswer('15',50),'retry');
 assert.equal(checkNumberAnswer('',50),'uncertain');
});
