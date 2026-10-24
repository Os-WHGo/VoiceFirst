/** Fail-closed, session-local readiness for A1 editorial audio.
 * No persistent trust: re-verify after restart, reinstall, or file replacement.
 */
import {a1AudioExpectedIds,type A1AudioAsset} from './a1-audio-readiness.js';
import {verifyA1AudioFile} from './a1-audio-file-verification.js';
import type {NativeLocalFileVerifier} from './local-model-file-verification.js';
export interface A1AudioLocalEntry {asset:A1AudioAsset;localUri:string}
export interface A1AudioLocalAudit {
 expected:number;verified:number;missing:readonly string[];
 rejected:readonly {id:string;reason:string}[];
 readyForEditorialPlayback:boolean;readyForPublicRelease:false;
}
export async function auditA1LocalAudio(entries:readonly A1AudioLocalEntry[],native:NativeLocalFileVerifier):Promise<A1AudioLocalAudit>{
 const expected=new Set(a1AudioExpectedIds);
 const seen=new Set<string>(),verified=new Set<string>();
 const rejected:{id:string;reason:string}[]=[];
 for(const entry of entries){
  const id=entry?.asset?.id;
  if(typeof id!=='string'||!expected.has(id)||seen.has(id)){
   rejected.push({id:typeof id==='string'?id:'unknown',reason:'unexpected-or-duplicate'});continue;
  }
  seen.add(id);
  const result=await verifyA1AudioFile(entry.asset,entry.localUri,native);
  if(result.status==='verified')verified.add(id);
  else rejected.push({id,reason:result.reason});
 }
 const missing=[...expected].filter(id=>!verified.has(id));
 return {expected:expected.size,verified:verified.size,missing,rejected,
  readyForEditorialPlayback:missing.length===0&&rejected.length===0,
  readyForPublicRelease:false};
}
