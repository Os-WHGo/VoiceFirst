/** Untrusted side-loaded audio metadata for PRIVATE C1/C2 editorial QA.
 * Passing schema checks never means the recording exists, is cleared or can ship.
 */
import {advancedListeningStoryboards} from './advanced-listening-storyboards.js';
import {a1AccentMatchesTarget} from './a1-audio-readiness.js';

export const advancedReviewManifestFormat='voicefirst.advanced-audio-editorial.v1';
export interface AdvancedReviewManifestEntry {
 audioId:string;bytes:number;sha256:string;accentTag:string;
 rightsReference:string;sourceReference:string;
}
export type AdvancedReviewManifestCheck=
 | {kind:'candidate';sceneId:string;clips:readonly AdvancedReviewManifestEntry[];
    publicAvailable:false;audioVerified:false}
 | {kind:'rejected';reason:string;publicAvailable:false;audioVerified:false};
const reject=(reason:string):AdvancedReviewManifestCheck=>({
 kind:'rejected',reason,publicAvailable:false,audioVerified:false
});
const record=(x:unknown):x is Record<string,unknown> =>
 x!==null&&typeof x==='object'&&!Array.isArray(x);
const exactKeys=(value:Record<string,unknown>,keys:readonly string[]):boolean=>
 Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const hex=/^[0-9a-f]{64}$/;
/** All six entries required, strict schema and stable authored IDs.
 * Audio verification is performed by the existing native verifier separately.
 */
export function inspectAdvancedReviewManifest(
 sceneId:string,value:unknown
):AdvancedReviewManifestCheck{
 const scene=advancedListeningStoryboards.find(s=>s.sceneId===sceneId);
 if(!scene)return reject('unknown-scene');
 if(!record(value)||!exactKeys(value,['format','sceneId','status','clips'])||
  value.format!==advancedReviewManifestFormat||value.sceneId!==sceneId||
  value.status!=='candidate-only'||!Array.isArray(value.clips)||
  value.clips.length!==6)return reject('invalid-manifest');
 const byId=new Map(scene.turns.map(t=>[t.audioId,t]));
 const seen=new Set<string>(),out:AdvancedReviewManifestEntry[]=[];
 for(const item of value.clips){
  if(!record(item)||!exactKeys(item,[
   'audioId','bytes','sha256','accentTag','rightsReference','sourceReference'
  ]))return reject('invalid-clip-row');
  if(typeof item.audioId!=='string'||!byId.has(item.audioId)||
   seen.has(item.audioId))return reject('unknown-or-duplicate-clip');
  if(!Number.isSafeInteger(item.bytes)||(item.bytes as number)<=0||
   (item.bytes as number)>8*1024*1024||
   typeof item.sha256!=='string'||!hex.test(item.sha256)||
   !a1AccentMatchesTarget(scene.targetLanguage,item.accentTag)||
   typeof item.rightsReference!=='string'||item.rightsReference.trim().length<3||
   item.rightsReference.length>160||
   typeof item.sourceReference!=='string'||item.sourceReference.trim().length<3||
   item.sourceReference.length>160)return reject('invalid-clip-metadata');
  seen.add(item.audioId);
  out.push({
   audioId:item.audioId,bytes:item.bytes as number,sha256:item.sha256,
   accentTag:item.accentTag as string,rightsReference:item.rightsReference,
   sourceReference:item.sourceReference
  });
 }
 if(seen.size!==6||scene.turns.some(t=>!seen.has(t.audioId)))
  return reject('incomplete-scene');
 return {kind:'candidate',sceneId,clips:out,publicAvailable:false,audioVerified:false};
}
