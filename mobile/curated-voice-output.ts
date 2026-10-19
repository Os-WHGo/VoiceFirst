/** Verified local narration first, system voice second.
 * System TTS offline capability depends on device/voice: not certified here.
 */
import * as Speech from 'expo-speech';
import {createAudioPlayer,setAudioModeAsync,type AudioPlayer} from 'expo-audio';
import {planVoiceOutput,PlaybackRequestOwnership,effectivePlaybackRate,curatedPlaybackTimeoutMs,type VoiceCue,type InstalledVoice} from '@voicefirst/core';
import {findVerifiedRecordedCue} from './installed-voice-pack';

const owner=new PlaybackRequestOwnership();
// Serialize every Speech.stop request: an older pending stop must never
// execute after the newest request has begun speaking.
let speechStopQueue:Promise<void>=Promise.resolve();
function stopSystemVoiceInOrder():Promise<void>{
 speechStopQueue=speechStopQueue.then(()=>Speech.stop()).then(()=>{},()=>{});
 return speechStopQueue;
}
/** Immediately revoke playback ownership even if the native stop is slow. */
export async function stopCuratedVoice():Promise<void>{
 owner.stop();
 await stopSystemVoiceInOrder();
}
export async function playCuratedVoice(line:VoiceCue,rate:number,
 onDone?:()=>void,onError?:(message:string)=>void):Promise<void>{
 // This token MUST be allocated before any await, including Speech.stop.
 const request=owner.claim();
 await stopSystemVoiceInOrder();
 if(!owner.isCurrent(request))return;
 const playbackRate=effectivePlaybackRate(rate);
 try{
  await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'doNotMix'});
  if(!owner.isCurrent(request))return;
  const local=await findVerifiedRecordedCue(line);
  if(!owner.isCurrent(request))return;
  if(local.kind==='invalid'){
   owner.finish(request);
   onError?.(`Grabación no válida: ${local.reason}. No se reproducirá.`);
   return;
  }
  if(local.kind==='verified'){
   const player:AudioPlayer=createAudioPlayer({uri:local.uri},{updateInterval:120});
   let disposed=false;
   let settled=false;
   let timer:ReturnType<typeof setTimeout>|undefined;
   let subscription:{remove:()=>void}|undefined;
   const dispose=()=>{
    if(disposed)return;
    disposed=true;
    if(timer!==undefined)clearTimeout(timer);
    try{subscription?.remove();}catch{}
    try{player.pause();}catch{}
    try{player.release();}catch{}
   };
   if(!owner.attach(request,dispose))return;
   const finish=(error?:string)=>{
    if(settled||!owner.isCurrent(request))return;
    settled=true;
    owner.finish(request);
    if(error)onError?.(error);
    else onDone?.();
   };
   subscription=player.addListener('playbackStatusUpdate',status=>{
    if(!owner.isCurrent(request))return;
    if(status.error){finish('La reproducción del audio local falló.');return;}
    if(status.didJustFinish)finish();
   });
   timer=setTimeout(()=>finish('La reproducción superó su duración esperada.'),
    curatedPlaybackTimeoutMs(local.durationMs,playbackRate));
   player.playbackRate=playbackRate;
   if(!owner.isCurrent(request))return;
   player.play();
   return;
  }
  const available=await Speech.getAvailableVoicesAsync();
  if(!owner.isCurrent(request))return;
  const voices:InstalledVoice[]=available.map(v=>({identifier:v.identifier,locale:v.language,
   quality:v.quality==='Enhanced'?'Enhanced':'Default',offlineVerified:false}));
  const plan=planVoiceOutput({cue:line,voices});
  if(plan.kind!=='native-tts'){
   owner.finish(request);
   onError?.('No existe voz compatible instalada. Puedes usar el texto de la pregunta.');
   return;
  }
  Speech.speak(line.text,{language:plan.voice.locale,voice:plan.voice.identifier,rate:playbackRate,
   onDone:()=>{if(owner.finish(request))onDone?.();},
   onStopped:()=>undefined,
   onError:()=>{if(owner.finish(request))onError?.('No se pudo reproducir la voz del sistema.');}});
 }catch{
  if(owner.finish(request))onError?.('No se pudo reproducir el audio; no se envió a VoiceFirst.');
 }
}
