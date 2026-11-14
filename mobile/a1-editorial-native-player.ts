/** Development-only local A1 voice review. No TTS fallback, network or user
 * progress. Only exact authored IDs mapped to our Documents folder can play.
 */
import {AppState} from 'react-native';
import {File} from 'expo-file-system';
import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {
 A1EditorialClipPlayer,effectivePlaybackRate,
 type A1EditorialPlaybackPort
} from '@voicefirst/core';
import {stopCuratedVoice} from './curated-voice-output';
import {privateA1EditorialAudioUri,a1NativeAudioVerifier} from './a1-editorial-local-audio';

export const a1EditorialExpoPort:A1EditorialPlaybackPort={
 async prepareForeground(){
  if(AppState.currentState!=='active')throw Error('A1 review requires foreground');
  await stopCuratedVoice();
  if(AppState.currentState!=='active')throw Error('A1 review backgrounded');
  await setAudioModeAsync({
   playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'doNotMix'
  });
  if(AppState.currentState!=='active')throw Error('A1 review backgrounded');
 },
 createLocalClip(audioId,rate){
  if(AppState.currentState!=='active')throw Error('No playback in background');
  const uri=privateA1EditorialAudioUri(audioId);
  if(!uri)throw Error('Unrecognized A1 audio turn');
  const file=new File(uri);
  // This immediate check complements the re-read/hash in the core controller.
  if(!file.exists||!Number.isSafeInteger(file.size)||
     file.size<=0||file.size>8*1024*1024)throw Error('Unavailable A1 review clip');
  const player=createAudioPlayer({uri},{updateInterval:120});
  let sub:{remove:()=>void}|null=null,released=false,finished=false;
  const stop=()=>{
   if(released)return;
   released=true;
   try{sub?.remove();}catch{}
   try{player.pause();}catch{}
   try{player.release();}catch{}
  };
  return{
   start(onDone,onError){
    if(released||AppState.currentState!=='active')throw Error('A1 playback cancelled');
    sub=player.addListener('playbackStatusUpdate',status=>{
     if(finished||released)return;
     if(status.error){finished=true;onError();}
     else if(status.didJustFinish){finished=true;onDone();}
    });
    player.playbackRate=effectivePlaybackRate(rate);
    player.play();
   },
   stop
  };
 }
};
/** Never share this player with public sessions or C1/C2 review state. */
export function createA1EditorialExpoPlayer(){
 return new A1EditorialClipPlayer(a1NativeAudioVerifier,a1EditorialExpoPort);
}
