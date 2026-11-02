import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('mobile hook reserves the mic before awaiting OS permissions',()=>{
 const source=readFileSync(new URL('../../../mobile/use-on-device-answer.ts',import.meta.url),'utf8');
 const claim=source.indexOf('owner.current=ours;microphoneOwner=ours;');
 const ask=source.indexOf('await native.requestMicrophonePermissionsAsync()');
 assert.ok(claim>=0&&ask>claim,'pending permissions must already have a cancellable mic owner');
 assert.match(source,/epoch\.current!==token\|\|owner\.current!==ours\|\|microphoneOwner!==ours/);
 assert.match(source,/languageRef\.current!==language\|\|AppState\.currentState!=='active'/);
});
test('mobile hook does not reopen native recognition from final or abort alone',()=>{
 const source=readFileSync(new URL('../../../mobile/use-on-device-answer.ts',import.meta.url),'utf8');
 assert.match(source,/if\(!nativeSessionGate\.canStart\(\)\)/);
 assert.match(source,/nativeSessionGate\.begin\(\)/);
 assert.match(source,/native\.addListener\('end',\(\)=>\{[\s\S]*?nativeSessionGate\.end\(\)/);
 assert.match(source,/native\?\.abort\(\)/);
});

test('one-shot end notification cannot unlock native recognition before end',()=>{
 const gate=new NativeSpeechSessionGate();
 assert.equal(gate.begin(),true);
 const received=[];
 gate.onEnd(()=>received.push('one'));
 gate.onEnd(()=>received.push('two'));
 assert.deepEqual(received,[]);
 assert.equal(gate.canStart(),false);
 gate.end();
 assert.deepEqual(received,['one','two']);
 assert.equal(gate.canStart(),true);
 gate.end();
 assert.deepEqual(received,['one','two'],'duplicate end has no effects');
});
test('a cancelled listener never starts the next microphone turn',()=>{
 const gate=new NativeSpeechSessionGate();gate.begin();
 const received=[];const cancel=gate.onEnd(()=>received.push('unexpected'));
 cancel();gate.end();
 assert.deepEqual(received,[]);
});
test('an end listener throwing does not strand other notified clients',()=>{
 const gate=new NativeSpeechSessionGate();gate.begin();
 const received=[];
 gate.onEnd(()=>{throw Error('detached view');});
 gate.onEnd(()=>received.push('still-notified'));
 gate.end();
 assert.deepEqual(received,['still-notified']);
});
