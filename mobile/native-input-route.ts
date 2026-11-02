/** Optional, read-only Expo native route observer for a foreground voice turn.
 * Missing native support must not disable phone-microphone learning.
 * A route snapshot is NOT evidence that the recognizer captured samples
 * from that input, especially on Android where recognition may be remote
 * from this app process. Do not save or send device port IDs.
 */
import {requireOptionalNativeModule} from 'expo';
import {parseNativeInputSnapshot,type NativeInputSnapshot} from '@voicefirst/core';

type NativeRouteModule={
 getInputSnapshotAsync():Promise<unknown>;
 addListener(name:'onInputRouteChanged',callback:(value:unknown)=>void):{remove():void};
};
function nativeModule():NativeRouteModule|null{
 try{
  const module=requireOptionalNativeModule<NativeRouteModule>('VoiceFirstAudioRoute');
  if(!module||typeof module.getInputSnapshotAsync!=='function'||
     typeof module.addListener!=='function')return null;
  return module;
 }catch{
  return null; // Expo Go or an older native build must remain usable.
 }
}
export async function readNativeInputSnapshot():Promise<NativeInputSnapshot|null>{
 const module=nativeModule();
 if(!module)return null;
 try{
  return parseNativeInputSnapshot(await module.getInputSnapshotAsync());
 }catch{
  return null; // No route must ever become a fabricated active microphone.
 }
}
export function observeNativeInputChanges(onChange:(snapshot:NativeInputSnapshot|null)=>void):()=>void{
 const module=nativeModule();
 if(!module)return ()=>{};
 try{
  const subscription=module.addListener('onInputRouteChanged',raw=>{
   onChange(parseNativeInputSnapshot(raw));
  });
  return ()=>{try{subscription.remove();}catch{/* Teardown must not crash the lesson. */}};
 }catch{
  return ()=>{};
 }
}
