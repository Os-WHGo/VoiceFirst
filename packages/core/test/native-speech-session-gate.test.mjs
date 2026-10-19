import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeSpeechSessionGate} from '../dist/index.js';

test('a completed transcript does not reopen recognition before native end',()=>{
 const g=new NativeSpeechSessionGate();
 assert.equal(g.begin(),true);
 // A final result has no native turn ID; the old session can still emit events.
 assert.equal(g.canStart(),false);
 assert.equal(g.begin(),false);
 g.end();
 assert.equal(g.begin(),true);
});
test('after an abort or error, recognition must wait for native termination',()=>{
 const g=new NativeSpeechSessionGate();
 assert.equal(g.begin(),true);
 // Abort/error do not call gate.end() until the terminal native event arrives.
 assert.equal(g.canStart(),false);
 g.end();
 assert.equal(g.canStart(),true);
 assert.equal(g.begin(),true);
});
test('a failed synchronous start can restore the idle gate',()=>{
 const g=new NativeSpeechSessionGate();
 assert.equal(g.begin(),true);
 g.end();
 assert.equal(g.begin(),true);
});
