/** VoiceFirst: offline pack (integrity verified) first, OS voice second.
 * The system TTS engine might access an OS-managed service: Expo cannot certify
 * it as entirely offline without device-specific verification.
 * No VoiceFirst/third-party generative API is called.
 */
import * as Speech from 'expo-speech';
import {createAudioPlayer,setAudioModeAsync,type AudioPlayer} from 'expo-audio';
import {planVoiceOutput,type VoiceCue,type InstalledVoice} from '@voicefirst/core';
import {findVerifiedRecordedCue} from './installed-voice-pack';

let playing:AudioPlayer|null=null;
let activeCleanup:(()=>void)|null=null;
let generation=0;
/** Stop playback without claiming the question was heard and without starting the microphone. */
export async function stopCuratedVoice(){
  generation++;
  activeCleanup?.();activeCleanup=null;
  try{playing?.pause();playing?.release();}catch{}
  playing=null;
  await Speech.stop();
}

export async function playCuratedVoice(line:VoiceCue,rate:number,
  onDone?:()=>void,onError?:(message:string)=>void):Promise<void>{
  await stopCuratedVoice();
  const request=generation;
  try{
    await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'doNotMix'});
    if(request!==generation)return;
    const local=await findVerifiedRecordedCue(line);
    if(request!==generation)return;
    if(local.kind==='invalid'){
      onError?.(`Grabación no válida: ${local.reason}. No se reproducirá.`);return;
    }
    if(local.kind==='verified'){
      const player=createAudioPlayer({uri:local.uri},{updateInterval:120});playing=player;
      const sub=player.addListener('playbackStatusUpdate',(status)=>{
        if(request!==generation)return;
        if(status.error){
          void stopCuratedVoice();onError?.('La reproducción del audio local falló.');return;
        }
        if(status.didJustFinish){
          void stopCuratedVoice().then(()=>{if(request+1===generation)onDone?.();});
        }
      });
      const timer=setTimeout(()=>{
        if(request!==generation)return;
        void stopCuratedVoice();onError?.('La reproducción superó su duración esperada.');
      },Math.max(5_000,local.durationMs+10_000));
      activeCleanup=()=>{clearTimeout(timer);sub.remove();};
      player.playbackRate=Math.max(0.65,Math.min(1.2,rate));
      player.play();
      return;
    }
    const available=await Speech.getAvailableVoicesAsync();
    if(request!==generation)return;
    const voices:InstalledVoice[]=available.map(v=>({identifier:v.identifier,locale:v.language,
      quality:v.quality==='Enhanced'?'Enhanced':'Default',offlineVerified:false}));
    const plan=planVoiceOutput({cue:line,voices});
    if(plan.kind!=='native-tts'){
      onError?.('No existe voz compatible instalada. Puedes usar el texto de la pregunta.');return;
    }
    Speech.speak(line.text,{language:plan.voice.locale,voice:plan.voice.identifier,rate,
      onDone:()=>{if(request===generation)onDone?.();},
      onStopped:()=>undefined,
      onError:()=>{if(request===generation)onError?.('No se pudo reproducir la voz del sistema.');}});
  }catch{
    if(request===generation)onError?.('No se pudo reproducir el audio; no se envió a VoiceFirst.');
  }
}
