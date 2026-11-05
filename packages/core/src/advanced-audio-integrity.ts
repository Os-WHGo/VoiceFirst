/** Session-local C1/C2 audio integrity audit for editorial rehearsal only.
 * Never trusts a manifest as proof of disk bytes, speech quality or publishing rights.
 * Native file verification is injected; no network, microphone or file reads here.
 */
import {advancedListeningStoryboards} from './advanced-listening-storyboards.js';
import {a1AccentMatchesTarget} from './a1-audio-readiness.js';
import type {NativeLocalFileVerifier} from './local-model-file-verification.js';

export interface AdvancedAudioCandidate {
 audioId:string;sceneId:string;localUri:string;
 bytes:number;sha256:string;accentTag:string;
 /** A repository or document identifier, NOT proof of legal clearance. */
 rightsReference:string;sourceReference:string;
}
export interface AdvancedSceneAudioReadiness {
 sceneId:string;verifiedTurns:number;requiredTurns:6;
 editorialAudioRehearsalReady:boolean;publicAvailable:false;
}
export interface AdvancedAudioIntegrityReport {
 expected:number;verified:number;verifiedIds:readonly string[];
 missing:readonly string[];rejected:readonly {id:string;reason:string}[];
 scenes:readonly AdvancedSceneAudioReadiness[];
 readyForPublicRelease:false;
}
const expected=advancedListeningStoryboards.flatMap(scene=>
 scene.turns.map(turn=>({audioId:turn.audioId,sceneId:scene.sceneId,locale:scene.targetLanguage})));
const expectedById=new Map(expected.map(item=>[item.audioId,item]));
const safeFileUri=/^file:\/\/\/[A-Za-z0-9_./-]+$/;
const hexDigest=/^[0-9a-f]{64}$/;
const maxClipBytes=32*1024*1024;
const maxTotalBytes=128*1024*1024;
type Rejection={id:string;reason:string};
const isObject=(raw:unknown):raw is Record<string,unknown> =>
 raw!==null&&typeof raw==='object'&&!Array.isArray(raw);
const isSafeUri=(value:unknown):value is string=>
 typeof value==='string'&&value.length<=512&&safeFileUri.test(value)&&
 !value.includes('..')&&!value.slice(8).startsWith('/')&&
 !value.slice(8).includes('//')&&
 !value.includes('\\')&&!value.includes('%')&&!value.includes('?')&&
 !value.includes('#');
function result(verifiedIds:ReadonlySet<string>,rejected:readonly Rejection[]):AdvancedAudioIntegrityReport{
 const missing=expected.map(x=>x.audioId).filter(id=>!verifiedIds.has(id));
 const scenes=advancedListeningStoryboards.map(scene=>{
  const verifiedTurns=scene.turns.filter(turn=>verifiedIds.has(turn.audioId)).length;
  return {sceneId:scene.sceneId,verifiedTurns,requiredTurns:6 as const,
   editorialAudioRehearsalReady:verifiedTurns===6&&rejected.length===0,
   publicAvailable:false as const};
 });
 return {expected:expected.length,verified:verifiedIds.size,verifiedIds:[...verifiedIds],
  missing,rejected,scenes,readyForPublicRelease:false};
}
/** Every manifest row is checked before the first I/O. No partial trust is
 * returned on a malformed, oversize or ambiguous input. Refuse duplicate URIs.
 * Re-run immediately before playback; never persist the verifiedIds result.
 */
export async function auditAdvancedSceneLocalAudio(
 entries:unknown,native:NativeLocalFileVerifier
):Promise<AdvancedAudioIntegrityReport>{
 const empty=new Set<string>();
 if(!Array.isArray(entries)||entries.length>expected.length||
  !native||typeof native.fileSizeBytes!=='function'||typeof native.sha256File!=='function')
  return result(empty,[{id:'manifest',reason:'invalid-input'}]);
 const rejected:Rejection[]=[],seenIds=new Set<string>(),seenUris=new Set<string>();
 let totalBytes=0;
 for(const entry of entries){
  if(!isObject(entry)){
   rejected.push({id:'unknown',reason:'invalid-row'});continue;
  }
  const id=typeof entry.audioId==='string'?entry.audioId:'unknown';
  const expectedRow=expectedById.get(id);
  if(!expectedRow||seenIds.has(id)){
   rejected.push({id,reason:'unknown-or-duplicate-id'});continue;
  }
  seenIds.add(id);
  if(!isSafeUri(entry.localUri)||seenUris.has(entry.localUri)){
   rejected.push({id,reason:'invalid-or-duplicate-uri'});continue;
  }
  seenUris.add(entry.localUri);
  if(entry.sceneId!==expectedRow.sceneId||
   typeof entry.bytes!=='number'||!Number.isSafeInteger(entry.bytes)||
   entry.bytes<=0||entry.bytes>maxClipBytes||
   typeof entry.sha256!=='string'||!hexDigest.test(entry.sha256)||
   !a1AccentMatchesTarget(expectedRow.locale,entry.accentTag)||
   typeof entry.rightsReference!=='string'||entry.rightsReference.trim().length<3||
   entry.rightsReference.length>160||
   typeof entry.sourceReference!=='string'||entry.sourceReference.trim().length<3||
   entry.sourceReference.length>160){
   rejected.push({id,reason:'invalid-metadata'});continue;
  }
  totalBytes+=entry.bytes;
  if(totalBytes>maxTotalBytes){
   rejected.push({id,reason:'audio-budget-exceeded'});break;
  }
 }
 // A rejected manifest never requests native file access or yields usable IDs.
 if(rejected.length)return result(empty,rejected);
 const verified=new Set<string>();
 for(const entry of entries as AdvancedAudioCandidate[]){
  try{
   const actualBytes=await native.fileSizeBytes(entry.localUri);
   if(actualBytes!==entry.bytes){
    rejected.push({id:entry.audioId,reason:'size-mismatch'});continue;
   }
   const digest=await native.sha256File(entry.localUri);
   if(typeof digest!=='string'||digest.toLowerCase()!==entry.sha256){
    rejected.push({id:entry.audioId,reason:'checksum-mismatch'});continue;
   }
   verified.add(entry.audioId);
  }catch{
   rejected.push({id:entry.audioId,reason:'native-verification-failed'});
  }
 }
 return result(verified,rejected);
}
