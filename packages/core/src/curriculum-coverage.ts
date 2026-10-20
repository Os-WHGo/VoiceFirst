/** Coverage of real curricular candidates, not a claim of reviewed or publishable lessons. */
import {targetLanguages,type TargetLanguage} from './types.js';
import {composeCurriculumCandidate,type SharedConcept,type TargetLanguageUnit,type KnownLanguageSupport} from './reusable-curriculum.js';

export type CoverageState='candidate'|'missing-target'|'missing-support'|'missing-both';
export interface ConceptCoverageCell {
 knownLanguage:TargetLanguage;
 targetLanguage:TargetLanguage;
 state:CoverageState;
 structurallyComposable:boolean;
 readyForPublicRelease:false;
}
export interface ConceptCoverageReport {
 conceptId:string;
 level:SharedConcept['level'];
 totalPairs:number;
 candidatePairs:number;
 missingPairs:number;
 cells:readonly ConceptCoverageCell[];
}
/** Only actual matching, valid resources count. Synthetic pairing never implies authored content. */
export function auditConceptCoverage(
 concept:SharedConcept,
 units:readonly TargetLanguageUnit[],
 supports:readonly KnownLanguageSupport[]
):ConceptCoverageReport {
 const cells:ConceptCoverageCell[]=[];
 for(const knownLanguage of targetLanguages)for(const targetLanguage of targetLanguages){
  if(knownLanguage===targetLanguage)continue;
  const unit=units.find(u=>u.conceptId===concept.id&&u.targetLanguage===targetLanguage);
  const support=supports.find(s=>s.conceptId===concept.id&&s.knownLanguage===knownLanguage);
  const composed=unit&&support?composeCurriculumCandidate(concept,unit,support):null;
  const validUnit=unit?Boolean(composeCurriculumCandidate(concept,unit,{
   conceptId:concept.id,knownLanguage:targetLanguages.find(l=>l!==targetLanguage)!,instructions:'Coverage validation only',editorialStatus:'candidate'
  })):false;
  const validSupport=support?Boolean(composeCurriculumCandidate(concept,{
   conceptId:concept.id,targetLanguage:targetLanguages.find(l=>l!==knownLanguage)!,dialogue:['Coverage validation only'],vocabulary:['Coverage validation only'],editorialStatus:'candidate',rightsCleared:false,audioReviewed:false
  },support)):false;
  const state:CoverageState=composed?'candidate':!validUnit&&!validSupport?'missing-both':!validUnit?'missing-target':'missing-support';
  cells.push({knownLanguage,targetLanguage,state,structurallyComposable:Boolean(composed),readyForPublicRelease:false});
 }
 const candidatePairs=cells.filter(c=>c.structurallyComposable).length;
 return {conceptId:concept.id,level:concept.level,totalPairs:cells.length,candidatePairs,missingPairs:cells.length-candidatePairs,cells};
}
