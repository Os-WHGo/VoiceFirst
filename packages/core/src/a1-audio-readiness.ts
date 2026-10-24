/** Conservative A1 offline audio readiness inventory.
 * This file does not ship recordings or synthesize audio.
 * An empty catalog must NEVER be interpreted as an installed voice pack.
 */
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
import type {TargetLanguage} from './types.js';
export type A1AudioRole='dialogue-first'|'dialogue-second';
export interface A1AudioAsset {
 id:string; targetLanguage:TargetLanguage; unitId:string; role:A1AudioRole;
 uri:string; sha256:string; bytes:number;
 reviewerId:string; rightsReference:string; accentTag:string;
}
export interface A1AudioGate {
 expected:number; verified:number; missing:readonly string[];
 readyForEditorialPlayback:boolean; readyForPublicRelease:false;
 errors:readonly string[];
}
export const a1AudioExpectedIds:readonly string[]=a1EditorialDrafts.flatMap(unit=>
 (['dialogue-first','dialogue-second'] as const).map(role=>[unit.targetLanguage,unit.unitId,role].join('/')));
const sha256=/^[a-f0-9]{64}$/;
const safeUri=/^[a-z0-9][a-z0-9/_-]*\.(wav|mp3|m4a|ogg)$/i;
/** Structural metadata check only: cannot prove actual file bytes, permission or linguistic quality. */
export function auditA1AudioAssets(input:unknown):A1AudioGate {
 const expected=new Set(a1AudioExpectedIds);
 if(!Array.isArray(input)||input.length>expected.size)return{
  expected:expected.size,verified:0,missing:[...expected],readyForEditorialPlayback:false,readyForPublicRelease:false,errors:['Invalid audio manifest']
 };
 const seen=new Set<string>();const errors:string[]=[];
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){errors.push('Invalid audio row');continue;}
  const a=raw as Partial<A1AudioAsset>;
  if(typeof a.id!=='string'||!expected.has(a.id)||seen.has(a.id)){errors.push('Unexpected or repeated audio ID');continue;}
  if(a.id!==[a.targetLanguage,a.unitId,a.role].join('/')||
     typeof a.uri!=='string'||!safeUri.test(a.uri)||a.uri.includes('..')||
     typeof a.sha256!=='string'||!sha256.test(a.sha256)||
     typeof a.bytes!=='number'||!Number.isSafeInteger(a.bytes)||a.bytes<=0||
     typeof a.reviewerId!=='string'||a.reviewerId.trim().length<3||
     typeof a.rightsReference!=='string'||a.rightsReference.trim().length<3||
     typeof a.accentTag!=='string'||a.accentTag.trim().length<2){
   errors.push('Incomplete audio metadata '+a.id);continue;
  }
  seen.add(a.id);
 }
 const missing=[...expected].filter(id=>!seen.has(id));
 return {expected:expected.size,verified:seen.size,missing,
  readyForEditorialPlayback:errors.length===0&&missing.length===0,
  readyForPublicRelease:false,errors};
}
export const a1AudioBaseline=auditA1AudioAssets([]);
