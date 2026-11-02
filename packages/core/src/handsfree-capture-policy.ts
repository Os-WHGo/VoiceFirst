/** Platform-neutral, evidence-first hands-free audio capability policy.
 * Informed by the Wivra DAT audit. No native accessory or microphone is
 * discovered or activated here; only observed runtime facts can prove it.
 *
 * Invariants:
 * - A request for an audio route is not proof of the active route.
 * - Registration and a product name do not prove glass microphone capture.
 * - Stopping is always permitted for an existing turn, even after route loss.
 * - Background start and screen-locked capture remain unsupported until a
 *   separate native implementation is validated under OS policy.
 * - A display capability never implies an audio/microphone capability.
 */
import {verifyInputRoute,type AudioInput,type AudioRouteResult} from './audio-routing.js';

export type HandsFreeInputMode='system-managed'|'bluetooth-hfp'|'wearable-sdk';
export type HandsFreePlatform='android'|'ios';
export interface ObservedAudioRoute {
 readonly selectedInputId:string;
 readonly activeInputId:string;
 readonly availableInputs:readonly AudioInput[];
 /** Monotonic clock from the SAME runtime as nowMonotonicMs. */
 readonly observedAtMs:number;
 /** Actual audio samples delivered in this capture turn, not a REC icon. */
 readonly capturedSamples:number;
 readonly lastSampleAtMs:number|null;
}
export interface ObservedWearable {
 readonly registration:'registered'|'registering'|'unregistered'|'unknown';
 readonly connected:boolean;
 readonly deviceId:string;
 readonly microphoneCapabilityObserved:boolean;
 readonly microphoneInputId:string|null;
 /** This is independent from any audio capability. */
 readonly displayCapabilityObserved:boolean;
 readonly displayFrameAcknowledged:boolean;
}
export interface HandsFreeEvidence {
 readonly platform:HandsFreePlatform;
 readonly mode:HandsFreeInputMode;
 readonly foreground:boolean;
 readonly permissionGranted:boolean;
 readonly explicitUserStart:boolean;
 readonly localSpeechReady:boolean;
 readonly turnActive:boolean;
 readonly nowMonotonicMs:number;
 readonly route?:ObservedAudioRoute|null;
 readonly wearable?:ObservedWearable|null;
}
export type HandsFreeBlocker=
 |'foreground-required'|'permission-required'|'explicit-start-required'
 |'offline-model-required'|'route-unverified'|'route-stale'|'route-rejected'
 |'headset-input-required'|'wearable-unregistered'|'wearable-not-connected'
 |'wearable-microphone-unsupported'|'wearable-input-mismatch';
export interface HandsFreeDecision {
 readonly canStart:boolean;
 /** A user must always be able to terminate an already active capture. */
 readonly canStop:boolean;
 readonly inputEvidence:'unverified'|'route-observed'|'capturing-samples';
 readonly verifiedWearableMicrophone:boolean;
 readonly blockers:readonly HandsFreeBlocker[];
 readonly routeStatus:AudioRouteResult['status']|'unverified';
 readonly displayReady:false;
}
const maxAgeMs=4000;
function fresh(observed:number,now:number):boolean{
 return Number.isFinite(now)&&Number.isFinite(observed)&&now>=0&&observed>=0&&now>=observed&&
  now-observed<=maxAgeMs;
}
/** The result is advisory. It does not start an OS audio session or guarantee
 * uninterrupted recording while the phone screen is locked.
 */
export function assessHandsFreeEvidence(e:HandsFreeEvidence):HandsFreeDecision{
 const blockers:HandsFreeBlocker[]=[];
 if(!e.foreground)blockers.push('foreground-required');
 if(!e.permissionGranted)blockers.push('permission-required');
 if(!e.explicitUserStart)blockers.push('explicit-start-required');
 if(!e.localSpeechReady)blockers.push('offline-model-required');
 const r=e.route;
 let routeStatus:HandsFreeDecision['routeStatus']='unverified';
 let inputEvidence:HandsFreeDecision['inputEvidence']='unverified';
 let routeInput:AudioInput|undefined;
 if(e.mode!=='system-managed'){
  if(!r)blockers.push('route-unverified');
  else if(!fresh(r.observedAtMs,e.nowMonotonicMs))blockers.push('route-stale');
  else{
   const result=verifyInputRoute({permission:e.permissionGranted,
    selectedId:r.selectedInputId,activeId:r.activeInputId,available:r.availableInputs});
   routeStatus=result.status;
   if(result.status==='active'){
    routeInput=result.input;
    inputEvidence='route-observed';
   }else blockers.push('route-rejected');
  }
  if(e.mode==='bluetooth-hfp'&&routeInput?.kind!=='bluetooth-hfp')
   blockers.push('headset-input-required');
 }
 let verifiedWearableMicrophone=false;
 if(e.mode==='wearable-sdk'){
  const w=e.wearable;
  if(w?.registration!=='registered')blockers.push('wearable-unregistered');
  if(!w?.connected||!w.deviceId.trim())blockers.push('wearable-not-connected');
  if(!w?.microphoneCapabilityObserved)blockers.push('wearable-microphone-unsupported');
  // Until a native DAT PCM source has its own evidence contract, only an
  // observed HFP input can be attributed to the wearable. The phone mic
  // must never become the glass mic just because IDs happened to match.
  if(routeInput?.kind!=='bluetooth-hfp'||!w?.microphoneInputId||w.microphoneInputId!==routeInput?.id)
   blockers.push('wearable-input-mismatch');
 }
 const canStart=!e.turnActive&&blockers.length===0;
 const sampleVerified=Boolean(e.turnActive&&r&&routeInput&&
  Number.isSafeInteger(r.capturedSamples)&&r.capturedSamples>0&&
  r.lastSampleAtMs!==null&&fresh(r.lastSampleAtMs,e.nowMonotonicMs));
 if(sampleVerified&&blockers.length===0){
  inputEvidence='capturing-samples';
  verifiedWearableMicrophone=e.mode==='wearable-sdk';
 }
 return {canStart,canStop:e.turnActive,inputEvidence,
  verifiedWearableMicrophone,blockers,routeStatus,displayReady:false};
}
/** Display is independently gated, never inferred from model name, pairing,
 * camera preview, a Bluetooth connection, or a microphone route.
 */
export function hasVerifiedWearableDisplay(w:ObservedWearable|null|undefined):boolean{
 return Boolean(w?.registration==='registered'&&w.connected&&w.deviceId.trim()&&
  w.displayCapabilityObserved&&w.displayFrameAcknowledged);
}
