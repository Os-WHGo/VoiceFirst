/** Read-only OS audio input observations, not microphone provenance.
 * iOS: AVAudioSession.currentRoute inputs of THIS app's session.
 * Android: AudioManager connected input inventory, NOT the SpeechRecognizer
 * service's active microphone, which may be owned by another process.
 * These observations are never persisted, logged, transmitted or scored.
 */
export type NativeInputScope='app-audio-session'|'connected-inputs-only';
export type NativeInputKind='built-in'|'bluetooth-hfp'|'wired'|'usb'|'unknown';
export interface NativeInputPort {
 readonly id:string;
 readonly kind:NativeInputKind;
}
export interface NativeInputSnapshot {
 readonly platform:'ios'|'android';
 readonly scope:NativeInputScope;
 readonly activeInputId:string|null;
 readonly connectedInputs:readonly NativeInputPort[];
 /** Epoch ms from the OS observer. Never compare with monotonic clocks. */
 readonly observedAtEpochMs:number;
}
const kinds=new Set(['built-in','bluetooth-hfp','wired','usb','unknown']);
/** Fail closed on malformed or deceptive native data; never infer
 * physical provenance from device name, paired status, or an ASR transcript.
 */
export function parseNativeInputSnapshot(value:unknown):NativeInputSnapshot|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const raw=value as Record<string,unknown>;
 if(raw.platform!=='ios'&&raw.platform!=='android')return null;
 const expectedScope=raw.platform==='ios'?'app-audio-session':'connected-inputs-only';
 if(raw.scope!==expectedScope)return null;
 if(typeof raw.observedAtEpochMs!=='number'||!Number.isFinite(raw.observedAtEpochMs)||
    raw.observedAtEpochMs<=0)return null;
 if(!Array.isArray(raw.connectedInputs)||raw.connectedInputs.length>24)return null;
 const inputs:NativeInputPort[]=[];
 const ids=new Set<string>();
 for(const value of raw.connectedInputs){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const port=value as Record<string,unknown>;
  if(typeof port.id!=='string'||port.id.trim()!==port.id||!port.id||
     port.id.length>256||typeof port.kind!=='string'||!kinds.has(port.kind)||
     ids.has(port.id))return null;
  ids.add(port.id);
  inputs.push({id:port.id,kind:port.kind as NativeInputKind});
 }
 if(raw.activeInputId!==null&&
   (typeof raw.activeInputId!=='string'||!ids.has(raw.activeInputId)))return null;
 if(raw.platform==='android'&&raw.activeInputId!==null)return null;
 return {platform:raw.platform,scope:expectedScope,
  activeInputId:raw.activeInputId as string|null,connectedInputs:inputs,
  observedAtEpochMs:raw.observedAtEpochMs};
}
function signature(snapshot:NativeInputSnapshot):string{
 return JSON.stringify({
  platform:snapshot.platform,scope:snapshot.scope,
  active:snapshot.activeInputId,
  inputs:snapshot.connectedInputs.map(p=>p.id+'|'+p.kind).sort()
 });
}
/** Given a previously observed route, stop (not re-route) a running turn when
 * its available inputs change or its iOS current input changes.
 * An unparsed/late observation cannot prove continuity; callers should treat
 * it as a reason to cancel an active turn and offer a safe retry.
 */
export function shouldInterruptForInputRouteChange(
 before:NativeInputSnapshot|null,after:NativeInputSnapshot|null
):boolean{
 if(!before||!after)return true;
 if(before.platform!==after.platform||before.scope!==after.scope||
    after.observedAtEpochMs<before.observedAtEpochMs)return true;
 return signature(before)!==signature(after);
}
/** This is an inventory/route check, NEVER proof of delivered PCM samples,
 * the glasses microphone, or VoiceFirst recognition routing.
 */
export function nativeRouteSourceVerifiedBySnapshot(_s:NativeInputSnapshot|null):false{
 return false;
}
