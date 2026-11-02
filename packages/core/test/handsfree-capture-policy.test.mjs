import test from 'node:test';
import assert from 'node:assert/strict';
import {assessHandsFreeEvidence,hasVerifiedWearableDisplay} from '../dist/index.js';

const input={id:'bt-port-1',label:'Connected HFP input',kind:'bluetooth-hfp',available:true};
const wearable={registration:'registered',connected:true,deviceId:'observed-device-1',
 microphoneCapabilityObserved:true,microphoneInputId:input.id,
 displayCapabilityObserved:false,displayFrameAcknowledged:false};
const baseline=()=>({
 platform:'android',mode:'wearable-sdk',foreground:true,permissionGranted:true,
 explicitUserStart:true,localSpeechReady:true,turnActive:false,nowMonotonicMs:5000,
 wearable:{...wearable},route:{selectedInputId:input.id,activeInputId:input.id,
  availableInputs:[input],observedAtMs:4900,capturedSamples:0,lastSampleAtMs:null}
});
test('a registered, connected wearable with verified route can request capture but not claim recorded audio',()=>{
 const result=assessHandsFreeEvidence(baseline());
 assert.equal(result.canStart,true);
 assert.equal(result.canStop,false);
 assert.equal(result.inputEvidence,'route-observed');
 assert.equal(result.verifiedWearableMicrophone,false,'registration and active route do not prove samples');
 assert.equal(result.displayReady,false);
});
test('actual audio sample evidence is required before claiming wearable input',()=>{
 const e=baseline();e.turnActive=true;e.route.capturedSamples=640;
 e.route.lastSampleAtMs=4990;
 const x=assessHandsFreeEvidence(e);
 assert.equal(x.canStart,false);assert.equal(x.canStop,true);
 assert.equal(x.inputEvidence,'capturing-samples');
 assert.equal(x.verifiedWearableMicrophone,true);
 e.route.lastSampleAtMs=900;
 assert.equal(assessHandsFreeEvidence(e).verifiedWearableMicrophone,false,'old samples are stale');
 e.route.lastSampleAtMs=5001;
 assert.equal(assessHandsFreeEvidence(e).verifiedWearableMicrophone,false,'future samples are invalid');
});
test('Bluetooth output, name or registration never substitute actual active microphone',()=>{
 const wrong=[
  x=>{x.route.activeInputId='phone-mic';},
  x=>{x.route.availableInputs=[{...input,available:false}];},
  x=>{x.route.availableInputs=[{...input,kind:'built-in'}];},
  x=>{x.route.availableInputs=[{...input,kind:'wireless-a2dp'}];},
  x=>{x.wearable.microphoneCapabilityObserved=false;},
  x=>{x.wearable.registration='registering';},
  x=>{x.wearable.connected=false;},
  x=>{x.wearable.deviceId='';},
  x=>{x.wearable.microphoneInputId='other-port';},
  x=>{x.route.observedAtMs=0;},
  x=>{x.route.observedAtMs=5001;}
 ];
 for(const change of wrong){
  const x=baseline();change(x);
  const result=assessHandsFreeEvidence(x);
  assert.equal(result.canStart,false,JSON.stringify(x));
  assert.equal(result.verifiedWearableMicrophone,false,JSON.stringify(x));
  assert.ok(result.blockers.length>0);
 }
});
test('no consent, microphone permission, local speech or foreground prevents all new capture',()=>{
 for(const [name,value] of [['foreground',false],['permissionGranted',false],
   ['explicitUserStart',false],['localSpeechReady',false]]){
  const x=baseline();x[name]=value;
  assert.equal(assessHandsFreeEvidence(x).canStart,false,name);
 }
 const active=baseline();active.turnActive=true;active.foreground=false;
 active.permissionGranted=false;active.route.activeInputId='lost';
 const decision=assessHandsFreeEvidence(active);
 assert.equal(decision.canStart,false);
 assert.equal(decision.canStop,true,'stop remains available if source lost or UI goes to background');
});
test('ordinary phone learning remains allowed with OS-managed unverified route but never claims headset',()=>{
 const e=baseline();e.mode='system-managed';e.wearable=null;e.route=null;
 const result=assessHandsFreeEvidence(e);
 assert.equal(result.canStart,true,'do not break existing phone learning');
 assert.equal(result.inputEvidence,'unverified');
 assert.equal(result.verifiedWearableMicrophone,false);
 e.mode='bluetooth-hfp';
 assert.equal(assessHandsFreeEvidence(e).canStart,false,'explicit headset selection demands evidence');
 e.route=baseline().route;e.mode='bluetooth-hfp';
 assert.equal(assessHandsFreeEvidence(e).canStart,true);
 e.route.availableInputs=[{...input,kind:'built-in'}];
 assert.equal(assessHandsFreeEvidence(e).canStart,false);
});
test('display is a separate capability and never inferred from microphone support or device branding',()=>{
 const w={...wearable};assert.equal(hasVerifiedWearableDisplay(w),false);
 w.displayCapabilityObserved=true;
 assert.equal(hasVerifiedWearableDisplay(w),false,'display declaration without rendered frame');
 w.displayFrameAcknowledged=true;
 assert.equal(hasVerifiedWearableDisplay(w),true);
 w.registration='unregistered';assert.equal(hasVerifiedWearableDisplay(w),false);
 assert.equal(hasVerifiedWearableDisplay(null),false);
});
test('invalid and non-monotonic route timestamps are not accepted',()=>{
 const invalid=[Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY,-1,5001];
 for(const stamp of invalid){const x=baseline();x.route.observedAtMs=stamp;
  assert.equal(assessHandsFreeEvidence(x).canStart,false,String(stamp));
 }
 const x=baseline();x.nowMonotonicMs=NaN;
 assert.equal(assessHandsFreeEvidence(x).canStart,false);
});
