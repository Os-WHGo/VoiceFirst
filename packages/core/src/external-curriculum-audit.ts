/** Gate external curriculum candidates before merging with the canonical A1 drafts.
 * No candidate becomes public or replaces existing course content through this check.
 */
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
export interface ExternalCurriculumAudit {acceptedForReview:boolean;unitCount:number;duplicates:readonly string[];collisions:readonly string[];errors:readonly string[];readyForPublicRelease:false}
export function auditExternalCurriculumCandidate(candidate:unknown):ExternalCurriculumAudit {
 const errors:string[]=[],duplicates:string[]=[],collisions:string[]=[];
 const units=(candidate&&typeof candidate==='object'&&!Array.isArray(candidate)?(candidate as {units?:unknown}).units:undefined);
 if(!Array.isArray(units))return {acceptedForReview:false,unitCount:0,duplicates,collisions,errors:['Missing units array'],readyForPublicRelease:false};
 const known=new Set(a1EditorialDrafts.map(u=>u.targetLanguage+'/'+u.unitId));
 const seen=new Set<string>();
 for(const item of units){
  if(!item||typeof item!=='object'||Array.isArray(item)){errors.push('Invalid unit object');continue;}
  const u=item as {id?:unknown;unitId?:unknown;targetLanguage?:unknown;level?:unknown};
  const id=u.id??u.unitId;
  const canonicalId=u.unitId??u.id;
  if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{2,100}$/.test(id)){errors.push('Invalid unit ID');continue;}
  const key=String(u.targetLanguage??'en-CA')+'/'+id;
  const canonicalKey=String(u.targetLanguage??'en-CA')+'/'+canonicalId;
  if(seen.has(key))duplicates.push(key);seen.add(key);
  if(typeof u.unitId!=='string')errors.push('Missing explicit canonical unit ID '+id);
  if(known.has(canonicalKey))collisions.push(canonicalKey);
  if(u.level!=='A1'&&u.level!=='A2')errors.push('Invalid level '+id);
  const skills=(item as {skills?:unknown}).skills;
  const required=['listening','speaking','reading','writing','interaction','mediation'];
  if(!skills||typeof skills!=='object'||Array.isArray(skills)||required.some(skill=>!(skill in skills)))errors.push('Missing required skills '+id);
  const status=(item as {status?:unknown}).status;
  if(!status||typeof status!=='object'||Array.isArray(status)||(status as {publishable?:unknown}).publishable!==false)errors.push('Candidate must explicitly prohibit publication '+id);
  if(u.targetLanguage!==undefined&&u.targetLanguage!=='en-CA')errors.push('Unexpected target language '+id);
 }
 return {acceptedForReview:errors.length===0&&duplicates.length===0,unitCount:units.length,duplicates,collisions,errors,readyForPublicRelease:false};
}
