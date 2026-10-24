/** A quarantine catalogue for independently authored lessons.
 * Deliberately returns metadata only; never imports exercises or exposes learner content.
 */
import {auditExternalCurriculumCandidate} from './external-curriculum-audit.js';
export interface ExternalCurriculumCatalogEntry {
 sourceId:string; canonicalUnitId:string; targetLanguage:string; level:'A1'|'A2';
 conflictsWithExistingDraft:boolean; reviewState:'candidate-only'; publicAvailable:false;
}
export interface ExternalCurriculumCatalog {
 acceptedForReview:boolean; entries:readonly ExternalCurriculumCatalogEntry[];
 errors:readonly string[]; collisions:readonly string[]; readyForPublicRelease:false;
}
export function catalogueExternalCurriculum(candidate:unknown):ExternalCurriculumCatalog {
 const audit=auditExternalCurriculumCandidate(candidate);
 if(!audit.acceptedForReview)return {acceptedForReview:false,entries:[],errors:audit.errors,collisions:audit.collisions,readyForPublicRelease:false};
 const doc=candidate as {units:readonly unknown[];metadata?:{language?:string;target?:string;targetLanguage?:string}};
 const units=doc.units;
 const declaredTarget=doc.metadata?.language??doc.metadata?.target??doc.metadata?.targetLanguage??'en-CA';
 const collisions=new Set(audit.collisions);
 const entries=units.map(item=>{
  const u=item as {id:string;unitId:string;level:'A1'|'A2';targetLanguage?:string};
  const targetLanguage=u.targetLanguage??declaredTarget;
  return {sourceId:u.id,canonicalUnitId:u.unitId,targetLanguage,level:u.level,
   conflictsWithExistingDraft:collisions.has(targetLanguage+'/'+u.unitId),
   reviewState:'candidate-only' as const,publicAvailable:false as const};
 });
 return {acceptedForReview:true,entries,errors:[],collisions:audit.collisions,readyForPublicRelease:false};
}
