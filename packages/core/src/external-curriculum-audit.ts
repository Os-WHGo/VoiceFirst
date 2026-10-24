/** Gate external curriculum candidates without publication. */
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
export interface ExternalCurriculumAudit {acceptedForReview:boolean;unitCount:number;duplicates:readonly string[];collisions:readonly string[];errors:readonly string[];readyForPublicRelease:false}
const supported=new Set(['en-CA','fr-CA','es','pt-BR','de','it']);
const skillsRequired=['listening','speaking','reading','writing','interaction','mediation'];
const validId=(x:unknown):x is string=>typeof x==='string'&&/^[a-z0-9][a-z0-9-]{2,100}$/.test(x);
export function auditExternalCurriculumCandidate(candidate:unknown):ExternalCurriculumAudit {
 const errors:string[]=[],duplicates:string[]=[],collisions:string[]=[];
 const doc=candidate&&typeof candidate==='object'&&!Array.isArray(candidate)?candidate as {units?:unknown;metadata?:unknown}:null;
 const units=doc?.units;
 if(!Array.isArray(units))return {acceptedForReview:false,unitCount:0,duplicates,collisions,errors:['Missing units array'],readyForPublicRelease:false};
 const meta=doc?.metadata&&typeof doc.metadata==='object'&&!Array.isArray(doc.metadata)?doc.metadata as {language?:unknown;target?:unknown;targetLanguage?:unknown}:null;
 const declared=[meta?.language,meta?.target,meta?.targetLanguage].filter(x=>x!==undefined);
 if(declared.some(x=>typeof x!=='string'||!supported.has(x)))errors.push('Unsupported metadata target language');
 if(new Set(declared).size>1)errors.push('Conflicting metadata target languages');
 const inferred=units.map(u=>u&&typeof u==='object'&&!Array.isArray(u)?(u as {targetLanguage?:unknown}).targetLanguage:undefined);
 const inferredUnique=new Set(inferred.filter(x=>typeof x==='string'));
 const target=declared[0]??(inferredUnique.size===1?[...inferredUnique][0]:undefined);
 if(target===undefined||!supported.has(String(target)))errors.push('Missing or ambiguous target language');
 const known=new Set(a1EditorialDrafts.map(u=>u.targetLanguage+'/'+u.unitId));
 const seen=new Set<string>(),seenCanonical=new Set<string>();
 for(const item of units){
  if(!item||typeof item!=='object'||Array.isArray(item)){errors.push('Invalid unit object');continue;}
  const u=item as {id?:unknown;unitId?:unknown;targetLanguage?:unknown;level?:unknown;skills?:unknown;status?:unknown};
  if(!validId(u.id)){errors.push('Invalid unit ID');continue;}
  const sourceKey=String(u.targetLanguage??target)+'/'+u.id;
  if(seen.has(sourceKey))duplicates.push(sourceKey);
  seen.add(sourceKey);
  if(!validId(u.unitId)){errors.push('Missing or invalid explicit canonical unit ID '+u.id);continue;}
  const locale=u.targetLanguage??target;
  if(typeof locale!=='string'||!supported.has(locale)||locale!==target)errors.push('Unit target language mismatch '+u.id);
  const canonicalKey=String(locale)+'/'+u.unitId;

  if(seenCanonical.has(canonicalKey))duplicates.push(canonicalKey);seenCanonical.add(canonicalKey);
  if(known.has(canonicalKey))collisions.push(canonicalKey);
  if(u.level!=='A1'&&u.level!=='A2'&&u.level!=='B1'&&u.level!=='B2')errors.push('Invalid level '+u.id);
  if(!u.skills||typeof u.skills!=='object'||Array.isArray(u.skills)||skillsRequired.some(s=>!(s in (u.skills as object))))errors.push('Missing required skills '+u.id);
  if(!u.status||typeof u.status!=='object'||Array.isArray(u.status)||(u.status as {publishable?:unknown}).publishable!==false)errors.push('Candidate must explicitly prohibit publication '+u.id);
 }
 return {acceptedForReview:errors.length===0&&duplicates.length===0,unitCount:units.length,duplicates,collisions,errors,readyForPublicRelease:false};
}
