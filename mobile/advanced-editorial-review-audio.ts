/** Private native bridge for C1/C2 audio review, not registered in public App.
 * Uses only app-owned Documents files and Expo's existing audio/file modules.
 * No system TTS fallback, downloads, remote audio or microphone capture.
 */
import {File,Paths} from 'expo-file-system';
import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {
 AdvancedEditorialClipPlayer,sha256Bytes,effectivePlaybackRate,
 advancedStoryboardExpectedAudioIds,
 type AdvancedAudioCandidate,type NativeLocalFileVerifier,
 type AdvancedReviewPlaybackPort
} from '@voicefirst/core';
import {stopCuratedVoice} from './curated-voice-output';

const allowedIds=new Set<string>(advancedStoryboardExpectedAudioIds);
const rootFolder='voicefirst-advanced-review';
/** Canonical app-private path. Importers must NOT import untrusted URI paths. */
export function privateAdvancedReviewUri(audioId:string):string|null{
 if(!allowedIds.has(audioId))return null;
 const segments=audioId.split('/');
 if(segments.length!==4)return null;
 const last=segments.pop()!;
 return new File(Paths.document,rootFolder,...segments,last+'.wav').uri;
}
function ownedFile(uri:string):File{
 if(typeof uri!=='string'||uri.length>512)throw Error('Invalid local audio URI');
 const segments=advancedStoryboardExpectedAudioIds.find(id=>privateAdvancedReviewUri(id)===uri);
 if(!segments)throw Error('Not inside approved VoiceFirst audio review folder');
 const file=new File(uri);
 if(!file.exists||!Number.isSafeInteger(file.size)||file.size<=0||
    file.size>8*1024*1024)throw Error('Unusable local audio file');
 return file;
}
export const advancedReviewNativeVerifier:NativeLocalFileVerifier={
 async fileSizeBytes(uri){
  return ownedFile(uri).size;
 },
 async sha256File(uri){
  const file=ownedFile(uri);
  const bytes=await file.bytes();
  if(bytes.byteLength!==file.size)throw Error('Audio changed while reading');
  return sha256Bytes(bytes);
 }
};
export const advancedReviewExpoAudioPort:AdvancedReviewPlaybackPort={
 async prepareForeground(){
  await stopCuratedVoice();
  await setAudioModeAsync({
   playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'doNotMix'
  });
 },
 createLocalClip(uri,rate){
  // Recheck app-private location even after the manifest audit.
  ownedFile(uri);
  const player=createAudioPlayer({uri},{updateInterval:120});
  let sub:{remove:()=>void}|null=null;
  let released=false;
  return {
   start(onDone,onError){
    if(released)throw Error('Audio review player was cancelled');
    sub=player.addListener('playbackStatusUpdate',status=>{
     if(status.error)onError();
     else if(status.didJustFinish)onDone();
    });
    player.playbackRate=effectivePlaybackRate(rate);
    player.play();
   },
   stop(){
    if(released)return;
    released=true;
    try{sub?.remove();}catch{}
    try{player.pause();}catch{}
    try{player.release();}catch{}
   }
  };
 }
};
/** For a dedicated internal editorial screen only. Do not add to learner routes. */
export function createAdvancedEditorialExpoPlayer(){
 return new AdvancedEditorialClipPlayer(
  advancedReviewNativeVerifier,advancedReviewExpoAudioPort
 );
}
/** Construct paths for locally reviewed files only. No files are created.
 * References in a candidate remain metadata; licenses need independent review.
 */
export function advancedReviewCandidateUri(candidate:AdvancedAudioCandidate):string|null{
 return privateAdvancedReviewUri(candidate.audioId)===candidate.localUri?
  candidate.localUri:null;
}
