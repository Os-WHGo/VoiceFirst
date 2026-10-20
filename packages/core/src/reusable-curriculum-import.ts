/** Quarantined import diagnostics for reusable six-language curriculum packages.
 * Does not mutate catalogues, install packages, or authorize release.
 */
import {targetLanguages,type TargetLanguage} from './types.js';
import {auditConceptCoverage,type ConceptCoverageReport} from './curriculum-coverage.js';
import {type SharedConcept,type TargetLanguageUnit,type KnownLanguageSupport} from './reusable-curriculum.js';

export interface ReusableImportDiagnostic {
 acceptedForReview:boolean;
 errors:readonly string[];
 coverage:readonly ConceptCoverageReport[];
 readyForPublicRelease:false;
}
const record=(x:unknown):x is Record<string,unknown>=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
const locales=new Set<string>(targetLanguages);
const levels=new Set(['A0','A1','A2','B1','B2','C1','C2']);
const skills=new Set(['listening','speaking','reading','writing','interaction','mediation']);
/** Import is all-or-nothing; never silently infer missing locales or synthesize content. */
export function inspectReusableCurriculumImport(candidate:unknown):ReusableImportDiagnostic {
 const errors:string[]=[];
 if(!record(candidate))return {acceptedForReview:false,errors:['Invalid package object'],coverage:[],readyForPublicRelease:false};
 const concepts=candidate.concepts,units=candidate.units,supports=candidate.supports;
 if(!Array.isArray(concepts)||!Array.isArray(units)||!Array.isArray(supports))
  return {acceptedForReview:false,errors:['Missing concepts, units or supports array'],coverage:[],readyForPublicRelease:false};
 if(concepts.length===0)errors.push('No shared concepts');
 const seenConcepts=new Set<string>(),seenUnits=new Set<string>(),seenSupports=new Set<string>();
 for(const c of concepts){
  if(!record(c)||typeof c.id!=='string'||!c.id.trim()||typeof c.goal!=='string'||!c.goal.trim()||!levels.has(String(c.level))||
   !Array.isArray(c.skills)||!c.skills.length||c.skills.some((s:unknown)=>!skills.has(String(s)))||
   !Array.isArray(c.prerequisites)||c.prerequisites.some((p:unknown)=>typeof p!=='string'||!p.trim()||p===c.id)||
   new Set(c.prerequisites).size!==c.prerequisites.length){errors.push('Invalid shared concept');continue;}
  if(seenConcepts.has(c.id))errors.push('Duplicate concept '+c.id);
  seenConcepts.add(c.id);
 }
 for(const u of units){
  if(!record(u)||typeof u.conceptId!=='string'||!seenConcepts.has(u.conceptId)||!locales.has(String(u.targetLanguage))||
   !Array.isArray(u.dialogue)||!u.dialogue.length||u.dialogue.some((s:unknown)=>typeof s!=='string'||!s.trim())||
   !Array.isArray(u.vocabulary)||!u.vocabulary.length||u.vocabulary.some((s:unknown)=>typeof s!=='string'||!s.trim())||
   !['candidate','reviewed'].includes(String(u.editorialStatus))||typeof u.rightsCleared!=='boolean'||typeof u.audioReviewed!=='boolean'){
   errors.push('Invalid target-language unit');continue;
  }
  const key=u.conceptId+'/'+u.targetLanguage;
  if(seenUnits.has(key))errors.push('Duplicate target-language unit '+key);
  seenUnits.add(key);
 }
 for(const s of supports){
  if(!record(s)||typeof s.conceptId!=='string'||!seenConcepts.has(s.conceptId)||!locales.has(String(s.knownLanguage))||
   typeof s.instructions!=='string'||!s.instructions.trim()||!['candidate','reviewed'].includes(String(s.editorialStatus))){
   errors.push('Invalid known-language support');continue;
  }
  const key=s.conceptId+'/'+s.knownLanguage;
  if(seenSupports.has(key))errors.push('Duplicate known-language support '+key);
  seenSupports.add(key);
 }
 if(errors.length)return {acceptedForReview:false,errors,coverage:[],readyForPublicRelease:false};
 const coverage=(concepts as SharedConcept[]).map(c=>auditConceptCoverage(c,units as TargetLanguageUnit[],supports as KnownLanguageSupport[]));
 return {acceptedForReview:true,errors:[],coverage,readyForPublicRelease:false};
}
