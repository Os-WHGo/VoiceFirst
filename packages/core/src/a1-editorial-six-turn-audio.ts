/** Private A1 six-turn WAV candidate metadata and bytes audit.
 * This is NOT the older two-turn A1 asset inventory or a public audio pack.
 * A manifest's existence cannot prove installed audio, copyright, consent,
 * spoken accuracy, offline playback, CEFR mastery or release readiness.
 */
import {expandedA1GreetingPilots} from './a1-expanded-greeting-pilots.js';
import {expandedA1SituationalPilots} from './a1-situational-pilots.js';
import {a1AccentMatchesTarget} from './a1-audio-readiness.js';
import {cueFingerprint} from './voice-library.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
export const a1SixTurnAudioFormat='voicefirst.a1-six-turn-editorial.v1';
const hex=/^[0-9a-f]{64}$/;
const maxClipBytes=8*1024*1024;
const maxClipDurationMs=120000;
type AudioScene=(typeof scenes)[number];
const sceneFor=(id:string):AudioScene|undefined=>scenes.find(s=>s.sceneId===id);
const record=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x:Record<string,unknown>,keys:readonly string[])=>Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
export interface A1SixTurnAudioCandidate {
 audioId:string;sourceFingerprint:string;bytes:number;durationMs:number;
 sha256:string;accentTag:string;rightsReference:string;sourceReference:string;
}
export type A1SixTurnAudioManifestCheck=
 | {kind:'candidate';sceneId:string;clips:readonly A1SixTurnAudioCandidate[];
    audioVerified:false;rightsCleared:false;publicAvailable:false}
 | {kind:'rejected';reason:string;audioVerified:false;rightsCleared:false;publicAvailable:false};
const reject=(reason:string):A1SixTurnAudioManifestCheck=>({
 kind:'rejected',reason,audioVerified:false,rightsCleared:false,publicAvailable:false
});
/** Exact six-turn source IDs and fingerprints. This fingerprint is NOT a
 * cryptographic rights or byte signature, merely a source-version marker.
 */
export function inspectA1SixTurnAudioManifest(sceneId:string,value:unknown):A1SixTurnAudioManifestCheck{
 const scene=sceneFor(sceneId);
 if(!scene)return reject('unknown-scene');
 if(!record(value)||!exact(value,['format','sceneId','status','clips'])||
  value.format!==a1SixTurnAudioFormat||value.sceneId!==sceneId||
  value.status!=='editorial-candidate'||!Array.isArray(value.clips)||
  value.clips.length!==6)return reject('invalid-manifest');
 const byId=new Map(scene.turns.map(t=>[t.audioId,t]));
 const seen=new Set<string>(),entries:A1SixTurnAudioCandidate[]=[];
 for(const raw of value.clips){
  if(!record(raw)||!exact(raw,[
   'audioId','sourceFingerprint','bytes','durationMs','sha256',
   'accentTag','rightsReference','sourceReference'
  ]))return reject('invalid-clip-row');
  const id=raw.audioId;
  if(typeof id!=='string'||!byId.has(id)||seen.has(id))return reject('unexpected-or-duplicate-id');
  seen.add(id);
  const turn=byId.get(id)!;
  if(raw.sourceFingerprint!==cueFingerprint(turn.text)||
   !Number.isSafeInteger(raw.bytes)||(raw.bytes as number)<=0||
   (raw.bytes as number)>maxClipBytes||
   !Number.isSafeInteger(raw.durationMs)||(raw.durationMs as number)<250||
   (raw.durationMs as number)>maxClipDurationMs||
   typeof raw.sha256!=='string'||!hex.test(raw.sha256)||
   !a1AccentMatchesTarget(scene.targetLanguage,raw.accentTag)||
   typeof raw.rightsReference!=='string'||raw.rightsReference.trim().length<3||
   raw.rightsReference.length>160||
   typeof raw.sourceReference!=='string'||raw.sourceReference.trim().length<3||
   raw.sourceReference.length>160)return reject('invalid-clip-metadata');
  entries.push(raw as unknown as A1SixTurnAudioCandidate);
 }
 if(seen.size!==6||scene.turns.some(t=>!seen.has(t.audioId)))return reject('incomplete-scene');
 return {kind:'candidate',sceneId,clips:scene.turns.map(t=>entries.find(c=>c.audioId===t.audioId)!),
  audioVerified:false,rightsCleared:false,publicAvailable:false};
}
/** The platform supplies app-owned file inspection, which MUST re-read bytes
 * and parse actual WAV PCM, not trust the JSON or an arbitrary file URI.
 * Audits are ephemeral: re-run before every eventual audio playback.
 */
export interface A1SixTurnNativeAudioVerifier {
 checkOwnedClip(audioId:string,durationMs:number):Promise<{
  bytes:number;sha256:string;validPcmWav:boolean;
 }>;
}
export interface A1SixTurnAudioAudit {
 sceneId:string;expected:6;verified:number;verifiedIds:readonly string[];
 rejected:readonly {audioId:string;reason:string}[];
 readyForEditorialPlayback:boolean;publicAvailable:false;
 rightsCleared:false;proofPersistent:false;
}
const failed=(sceneId:string,reason:string):A1SixTurnAudioAudit=>({
 sceneId,expected:6,verified:0,verifiedIds:[],
 rejected:[{audioId:'manifest',reason}],readyForEditorialPlayback:false,
 publicAvailable:false,rightsCleared:false,proofPersistent:false
});
export async function auditA1SixTurnAudio(
 sceneId:string,manifest:unknown,verifier:A1SixTurnNativeAudioVerifier
):Promise<A1SixTurnAudioAudit>{
 const checked=inspectA1SixTurnAudioManifest(sceneId,manifest);
 if(checked.kind!=='candidate')return failed(sceneId,checked.reason);
 if(!verifier||typeof verifier.checkOwnedClip!=='function')
  return failed(sceneId,'missing-native-verifier');
 const verifiedIds:string[]=[],rejected:{audioId:string;reason:string}[]=[];
 for(const clip of checked.clips){
  try{
   const actual=await verifier.checkOwnedClip(clip.audioId,clip.durationMs);
   if(!actual||!Number.isSafeInteger(actual.bytes)||actual.bytes!==clip.bytes)
    rejected.push({audioId:clip.audioId,reason:'size-mismatch'});
   else if(typeof actual.sha256!=='string'||actual.sha256.toLowerCase()!==clip.sha256)
    rejected.push({audioId:clip.audioId,reason:'sha256-mismatch'});
   else if(actual.validPcmWav!==true)
    rejected.push({audioId:clip.audioId,reason:'invalid-pcm-wav'});
   else verifiedIds.push(clip.audioId);
  }catch{rejected.push({audioId:clip.audioId,reason:'native-file-error'});}
 }
 return {sceneId,expected:6,verified:verifiedIds.length,verifiedIds,rejected,
  readyForEditorialPlayback:verifiedIds.length===6&&rejected.length===0,
  publicAvailable:false,rightsCleared:false,proofPersistent:false};
}
