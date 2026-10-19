import test from 'node:test';
import assert from 'node:assert/strict';
import {planLanguagePacks} from '../dist/index.js';
const sha='a'.repeat(64);
const pack=(id,dependencies=[],bytes=100)=>({id,kind:'course',locales:['es','en-CA'],dependencies,bytes,sha256:sha,licenseId:'test-only',sourceUrl:'https://example.org/'+id});
test('shared dependencies install once and already installed packages are skipped',()=>{
 const catalog=[pack('shared'),pack('english',['shared'],200),pack('chilean',['shared'],50)];
 assert.deepEqual(planLanguagePacks(catalog,[],['english','chilean']),{ok:true,install:['shared','english','chilean'],totalBytes:350});
 assert.deepEqual(planLanguagePacks(catalog,['shared'],['english','chilean']),{ok:true,install:['english','chilean'],totalBytes:250});
});
test('missing and cyclic dependencies fail closed',()=>{
 assert.deepEqual(planLanguagePacks([pack('a',['absent'])],[],['a']),{ok:false,reason:'missing'});
 assert.deepEqual(planLanguagePacks([pack('a',['b']),pack('b',['a'])],[],['a']),{ok:false,reason:'cycle'});
 assert.deepEqual(planLanguagePacks([pack('a'),pack('a')],[],['a']),{ok:false,reason:'invalid'});
});
