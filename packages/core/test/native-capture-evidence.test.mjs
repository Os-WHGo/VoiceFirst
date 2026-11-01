import test from 'node:test';
import assert from 'node:assert/strict';
import {newNativeCaptureEvidence,recordNativeCaptureSignal,nativeCaptureCanReleaseGate} from '../dist/index.js';

test('native audio capture start and stop do not release recognition ownership before terminal end',()=>{
 const requested=newNativeCaptureEvidence();
 assert.equal(requested.phase,'requested');
 assert.equal(nativeCaptureCanReleaseGate(requested),false);
 const capturing=recordNativeCaptureSignal(requested,'audiostart',1780000000100);
 assert.equal(capturing.phase,'capturing');
 assert.equal(capturing.startedAtMs,1780000000100);
 assert.equal(capturing.audioStarts,1);
 const processing=recordNativeCaptureSignal(capturing,'audioend',1780000001800);
 assert.equal(processing.phase,'processing');
 assert.equal(processing.audioEnds,1);
 assert.equal(processing.endedAtMs,1780000001800);
 assert.equal(nativeCaptureCanReleaseGate(processing),false);
 const finished=recordNativeCaptureSignal(processing,'end');
 assert.equal(finished.phase,'terminal');
 assert.equal(nativeCaptureCanReleaseGate(finished),true);
 assert.deepEqual(recordNativeCaptureSignal(finished,'audiostart',1780000002000),finished,
  'late events after end are not a new turn');
});
test('a restart within one non-continuous native capture is suspicious even if ASR continues',()=>{
 let state=newNativeCaptureEvidence();
 state=recordNativeCaptureSignal(state,'audiostart',1500);
 state=recordNativeCaptureSignal(state,'audioend',1550);
 state=recordNativeCaptureSignal(state,'audiostart',1600);
 assert.equal(state.audioStarts,2);
 assert.equal(state.discontinuity,true);
});
test('duplicate starts and ends cannot be mistaken for a single uninterrupted input',()=>{
 let state=recordNativeCaptureSignal(newNativeCaptureEvidence(),'audiostart');
 state=recordNativeCaptureSignal(state,'audiostart');
 assert.equal(state.discontinuity,true);
 state=recordNativeCaptureSignal(newNativeCaptureEvidence(),'audioend');
 state=recordNativeCaptureSignal(state,'audioend');
 assert.equal(state.discontinuity,true);
});
test('native event timestamps are only accepted when finite and positive',()=>{
 for(const stamp of [undefined,null,'1800',NaN,Infinity,-Infinity,-1,0,{}]){
  assert.equal(recordNativeCaptureSignal(newNativeCaptureEvidence(),'audiostart',stamp).startedAtMs,null);
 }
 let state=recordNativeCaptureSignal(newNativeCaptureEvidence(),'audiostart',1500);
 state=recordNativeCaptureSignal(state,'audioend',1000);
 assert.equal(state.discontinuity,true);
 assert.equal(state.endedAtMs,1000);
});
test('an audioend without audiostart does not falsely claim delivered audio samples',()=>{
 let state=recordNativeCaptureSignal(newNativeCaptureEvidence(),'audioend',2200);
 assert.equal(state.phase,'processing');
 assert.equal(state.audioStarts,0);
 assert.equal(state.startedAtMs,null);
 assert.equal(state.discontinuity,false);
 assert.equal(nativeCaptureCanReleaseGate(state),false);
});
