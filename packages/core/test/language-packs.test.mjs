import test from 'node:test';
import assert from 'node:assert/strict';
import {planLanguagePacks} from '../dist/index.js';
const pack=(id,dependencies=[])=>({id,kind:'course',version:'1.0.0',bytes:100,dependencies,locales:['es'],sha256:'a'.repeat(64),licenseId:'MIT',licenseReviewed:true,sourceUrl:'https://example.org/file'});
test('shared packs are planned only once',()=>{
 const catalog=[pack('base'),pack('course-a',['base']),pack('course-b',['base'])];
 assert.deepEqual(planLanguagePacks(catalog,['course-a','course-b']).install,['base','course-a','course-b']);
 assert.deepEqual(planLanguagePacks(catalog,['course-a'],['base']).install,['course-a']);
});
test('missing dependencies and cycles fail closed',()=>{
 assert.equal(planLanguagePacks([pack('a',['missing'])],['a']).status,'invalid');
 assert.equal(planLanguagePacks([pack('a',['b']),pack('b',['a'])],['a']).status,'invalid');
});
