import test from 'node:test';
import assert from 'node:assert/strict';
import {planLanguagePacks} from '../dist/index.js';
const sha='a'.repeat(64);
const pack=(id,dependencies=[],bytes=100)=>({id,kind:'course',version:'1.0.0',locales:['es','en-CA'],dependencies,bytes,sha256:sha,licenseId:'test-only',licenseReviewed:true,sourceUrl:'https://example.org/'+id});
test('canonical planner reuses shared dependencies and skips installed packages',()=>{
 const catalog=[pack('shared'),pack('english',['shared'],200),pack('chilean',['shared'],50)];
 assert.deepEqual(planLanguagePacks(catalog,['english','chilean']),{status:'ready',install:['shared','english','chilean'],bytes:350});
 assert.deepEqual(planLanguagePacks(catalog,['english','chilean'],['shared']),{status:'ready',install:['english','chilean'],bytes:250});
});
test('canonical planner rejects missing dependencies, cycles and duplicate identifiers',()=>{
 assert.equal(planLanguagePacks([pack('a',['absent'])],['a']).status,'invalid');
 assert.equal(planLanguagePacks([pack('a',['b']),pack('b',['a'])],['a']).status,'invalid');
 assert.equal(planLanguagePacks([pack('a'),pack('a')],['a']).status,'invalid');
});
