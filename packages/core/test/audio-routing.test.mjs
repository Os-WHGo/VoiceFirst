import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyInputRoute,shouldStopAudioCapture} from '../dist/index.js';
const mic={id:'bt-123',label:'Headset microphone',kind:'bluetooth-hfp',available:true};
const call=(overrides={})=>verifyInputRoute({permission:true,selectedId:mic.id,activeId:mic.id,available:[mic],...overrides});
test('active Bluetooth identity is based on an actual input, not brand guessing',()=>{
  const result=call();assert.equal(result.status,'active');assert.equal(result.input.kind,'bluetooth-hfp');
});
test('a requested Bluetooth device that disconnects must not silently turn into phone mic',()=>{
  const before=call();const after=call({activeId:'built-in',available:[{...mic,available:false},{id:'built-in',kind:'built-in',available:true,label:'Phone'}]});
  assert.equal(after.status,'disconnected');assert.equal(shouldStopAudioCapture(before,after),true);
});
test('a failed setPreferredInput request is not misreported as active',()=>{
  const after=call({activeId:'other'});assert.equal(after.status,'route-rejected');
  assert.equal(shouldStopAudioCapture(call(),after),true);
});
test('no permission and no selected device never activate capture',()=>{
  assert.equal(call({permission:false}).status,'needs-permission');
  assert.equal(call({selectedId:''}).status,'not-selected');
});
test('unsupported source must not be recognized as a supported microphone',()=>{
  assert.equal(call({available:[{...mic,kind:'remote-camera'}]}).status,'unsupported');
});
test('stable unchanged input does not interrupt a session',()=>{
  assert.equal(shouldStopAudioCapture(call(),call()),false);
});
