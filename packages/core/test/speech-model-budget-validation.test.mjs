import test from 'node:test';
import assert from 'node:assert/strict';
import {assessModelFit,measuredSpeechCandidates} from '../dist/index.js';

const source=measuredSpeechCandidates[0];
const entry={...source,pack:{...source.pack,licenseReviewed:true}};
const phone={platform:'android',totalRamMb:6144,freeDiskBytes:5000000000};

test('empty available device memory blocks model selection',()=>{
 const result=assessModelFit(entry,{...phone,totalRamMb:0});
 assert.ok(result.problems.includes('memory'));
 assert.equal(result.usable,false);
});
test('empty available device storage blocks model selection',()=>{
 const result=assessModelFit(entry,{...phone,freeDiskBytes:0});
 assert.ok(result.problems.includes('storage'));
 assert.equal(result.usable,false);
});
test('model fit rejects unsupported RAM allocation limits',()=>{
 const result=assessModelFit(entry,phone,{ramShare:0});
 assert.ok(result.problems.includes('memory'));
 assert.equal(result.usable,false);
});
