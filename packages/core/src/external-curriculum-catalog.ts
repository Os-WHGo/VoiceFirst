/** A quarantine catalogue for independently authored lessons.
 * Deliberately returns metadata only; never imports exercises or exposes learner content.
 */
import {auditExternalCurriculumCandidate,classifyExternalDraftEvidence,type ExternalDraftEvidence} from './external-curriculum-audit.js';
export type ExternalCurriculumLevel='A1'|'A2'|'B1'|'B2'|'C1'|'C2';
export interface ExternalCurriculumCatalogEntry {
 sourceId:string; canonicalUnitId:string; targetLanguage:string; level:ExternalCurriculumLevel;
 conflictsWithExistingDraft:boolean; reviewState:'candidate-only'; publicAvailable:false;
 /** Evidence of draft TEXT only; never implies usable exercise, review or CEFR level attainment. */
 contentEvidence:ExternalDraftEvidence;
}
export interface ExternalCurriculumCatalog {
 acceptedForReview:boolean; entries:readonly ExternalCurriculumCatalogEntry[];
 errors:readonly string[]; collisions:readonly string[]; readyForPublicRelease:false;
 textDraftCount:number;outlineOnlyCount:number;
}
export function catalogueExternalCurriculum(candidate:unknown):ExternalCurriculumCatalog {
 const audit=auditExternalCurriculumCandidate(candidate);
 if(!audit.acceptedForReview)return {acceptedForReview:false,entries:[],errors:audit.errors,collisions:audit.collisions,readyForPublicRelease:false,textDraftCount:0,outlineOnlyCount:0};
 const doc=candidate as {units:readonly unknown[];metadata?:{language?:string;target?:string;targetLanguage?:string}};
 const units=doc.units;
 const declaredTarget=doc.metadata?.language??doc.metadata?.target??doc.metadata?.targetLanguage;
 // The auditor already proved that a target exists either here or in each unit.
 const collisions=new Set(audit.collisions);
 const entries=units.map(item=>{
  const u=item as {id:string;unitId:string;level:ExternalCurriculumLevel;targetLanguage?:string};
  const targetLanguage=u.targetLanguage??declaredTarget!;
  return {sourceId:u.id,canonicalUnitId:u.unitId,targetLanguage,level:u.level,
   conflictsWithExistingDraft:collisions.has(targetLanguage+'/'+u.unitId),
   contentEvidence:classifyExternalDraftEvidence(item),
   reviewState:'candidate-only' as const,publicAvailable:false as const};
 });
 return {acceptedForReview:true,entries,errors:[],collisions:audit.collisions,readyForPublicRelease:false,
  textDraftCount:entries.filter(entry=>entry.contentEvidence==='text-draft-unreviewed').length,
  outlineOnlyCount:entries.filter(entry=>entry.contentEvidence==='outline-only').length};
}
