/** Normalize external candidate unit identities without making content publishable. */
export type CandidateLocale='en-CA'|'fr-CA'|'es'|'pt-BR'|'de'|'it';
export interface CandidateUnitSummary {id:string;level:'A1'|'A2';targetLanguage:CandidateLocale;publishable:false}
export interface CandidateManifestAudit {acceptedForReview:boolean;units:readonly CandidateUnitSummary[];errors:readonly string[];readyForPublicRelease:false}
const locales:readonly string[]=['en-CA','fr-CA','es','pt-BR','de','it'];
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function auditMultilingualCandidate(input:unknown,expectedLocale:CandidateLocale):CandidateManifestAudit {
 const errors:string[]=[],units:CandidateUnitSummary[]=[];
 if(!locales.includes(expectedLocale))errors.push('Unsupported target language');
 if(!record(input)||!Array.isArray(input.units))return {acceptedForReview:false,units,errors:['Missing units array',...errors],readyForPublicRelease:false};
 const meta=record(input.meta)?input.meta:{};
 if(typeof meta.language==='string'&&meta.language!==expectedLocale)errors.push('Metadata language mismatch');
 const seen=new Set<string>();
 for(const [index,value] of input.units.entries()){
  if(!record(value)){errors.push('Invalid unit at '+index);continue;}
  const id=value.id??value.unitId;
  if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{2,100}$/.test(id)){errors.push('Invalid unit id at '+index);continue;}
  if(seen.has(id))errors.push('Duplicate unit '+id);
  seen.add(id);
  if(value.level!=='A1'&&value.level!=='A2'){errors.push('Invalid level '+id);continue;}
  if(typeof value.targetLanguage==='string'&&value.targetLanguage!==expectedLocale)errors.push('Unit locale mismatch '+id);
  if(value.publishable===true||(record(value.status)&&value.status.publishable===true))errors.push('Publishable candidate '+id);
  if(value.editorial_status==='human-reviewed')errors.push('Unverified editorial approval '+id);
  units.push({id,level:value.level,targetLanguage:expectedLocale,publishable:false});
 }
 return {acceptedForReview:errors.length===0&&units.length>0,units,errors,readyForPublicRelease:false};
}
