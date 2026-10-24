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
 assert.match(source,/native\.addListener\('end',\(\)=>\{\s*nativeSessionGate\.end\(\)/);
 assert.match(source,/native\?\.abort\(\)/);
});
