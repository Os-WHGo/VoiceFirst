import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNativeInputSnapshot,shouldInterruptForInputRouteChange,nativeRouteSourceVerifiedBySnapshot} from '../dist/index.js';

const ios=()=>({platform:'ios',scope:'app-audio-session',activeInputId:'internal',
 connectedInputs:[{id:'internal',kind:'built-in'},{id:'headset',kind:'bluetooth-hfp'}],
 observedAtEpochMs:1780000100000});
const android=()=>({platform:'android',scope:'connected-inputs-only',activeInputId:null,
 connectedInputs:[{id:'internal',kind:'built-in'},{id:'headset',kind:'bluetooth-hfp'}],
 observedAtEpochMs:1780000100000});

test('iOS detects actual input route change without mistaking input order for a route change',()=>{
 const a=parseNativeInputSnapshot(ios());
 assert.ok(a);
 const reorder=parseNativeInputSnapshot({...ios(),connectedInputs:[...ios().connectedInputs].reverse()});
 assert.equal(shouldInterruptForInputRouteChange(a,reorder),false);
 const switched=parseNativeInputSnapshot({...ios(),activeInputId:'headset'});
 assert.equal(shouldInterruptForInputRouteChange(a,switched),true);
});
test('Android connected input inventory is not proof of active speech recognition microphone',()=>{
 const a=parseNativeInputSnapshot(android());
 assert.equal(a.activeInputId,null);
 assert.equal(nativeRouteSourceVerifiedBySnapshot(a),false);
 const unplugged=parseNativeInputSnapshot({...android(),connectedInputs:[{id:'internal',kind:'built-in'}]});
 assert.equal(shouldInterruptForInputRouteChange(a,unplugged),true);
 assert.equal(shouldInterruptForInputRouteChange(a,parseNativeInputSnapshot(android())),false);
});
test('stale, absent and malformed observations interrupt instead of trusting unknown routes',()=>{
 const a=parseNativeInputSnapshot(ios());
 assert.equal(shouldInterruptForInputRouteChange(a,null),true);
 assert.equal(shouldInterruptForInputRouteChange(null,a),true);
 assert.equal(shouldInterruptForInputRouteChange(a,parseNativeInputSnapshot({...ios(),observedAtEpochMs:2})),true);
 for(const candidate of [null,{},[],{...ios(),platform:'other'},{...ios(),activeInputId:'missing'},
  {...android(),activeInputId:'headset'},{...ios(),observedAtEpochMs:Infinity},
  {...ios(),connectedInputs:[{id:'internal',kind:'invalid'}]},
  {...ios(),connectedInputs:[{id:'internal',kind:'built-in'},{id:'internal',kind:'usb'}]}]){
  assert.equal(parseNativeInputSnapshot(candidate),null);
 }
});
test('device labels and a supported route alone cannot prove actual PCM source',()=>{
 const sample=parseNativeInputSnapshot({...ios(),activeInputId:'accessory',
  connectedInputs:[{id:'accessory',kind:'bluetooth-hfp'}]});
 assert.ok(sample);
 assert.equal(nativeRouteSourceVerifiedBySnapshot(sample),false);
});

test('two-snapshot watcher handoff detects an unplug between initial read and event subscription',()=>{
 // A notification can be missed before subscribe, even though the first
 // native snapshot looked healthy. The post-subscription read must be checked.
 const iosBefore=parseNativeInputSnapshot(ios());
 const iosAfter=parseNativeInputSnapshot({...ios(),activeInputId:'headset',
  observedAtEpochMs:1780000100010});
 assert.equal(shouldInterruptForInputRouteChange(iosBefore,iosAfter),true);
 const androidBefore=parseNativeInputSnapshot(android());
 const androidAfter=parseNativeInputSnapshot({...android(),
  connectedInputs:[{id:'internal',kind:'built-in'}],
  observedAtEpochMs:1780000100010});
 assert.equal(shouldInterruptForInputRouteChange(androidBefore,androidAfter),true);
 assert.equal(shouldInterruptForInputRouteChange(androidBefore,parseNativeInputSnapshot({
  ...android(),observedAtEpochMs:1780000100010})),false);
 assert.equal(shouldInterruptForInputRouteChange(iosBefore,null),true);
});
