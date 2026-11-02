import test from 'node:test';
import assert from 'node:assert/strict';
import {beginLocalModelInstall,advanceLocalModelInstall} from '../dist/index.js';
test('local model install cannot commit before independent digest verification',()=>{
 const pkg={id:'sample',runtime:'llama.cpp',locales:['en-CA'],bytes:2048,sha256:'a'.repeat(64),licenseId:'Apache-2.0',licenseReviewed:true,sourceUrl:'https://example.org/model',contextTokens:1024};
 const begin=beginLocalModelInstall(pkg);assert.equal(begin.status,'ok');
 const stage=begin.state;
 assert.equal(advanceLocalModelInstall(stage,'commit').status,'rejected');
 assert.equal(advanceLocalModelInstall(stage,'verify','b'.repeat(64)).reason,'checksum-mismatch');
 const verified=advanceLocalModelInstall(stage,'verify','A'.repeat(64));assert.equal(verified.status,'ok');
 assert.equal(advanceLocalModelInstall(verified.state,'commit').state.phase,'installed');
 assert.equal(advanceLocalModelInstall(stage,'abort').state.phase,'failed');
 assert.equal(advanceLocalModelInstall({...stage,phase:'failed'},'commit').status,'rejected');
 assert.equal(beginLocalModelInstall({...pkg,licenseReviewed:false}).status,'rejected');
});
