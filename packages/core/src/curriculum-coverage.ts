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
/** Check only genuine authored candidate resources. Do not manufacture a
 * substitute dialogue or translation to infer whether a lesson exists.
 * These predicates are structural; they never approve pedagogical quality.
 */
const availableUnit=(concept:SharedConcept,unit:TargetLanguageUnit|undefined):boolean=>
 Boolean(unit&&unit.conceptId===concept.id&&targetLanguages.includes(unit.targetLanguage)&&
  Array.isArray(unit.dialogue)&&unit.dialogue.every(line=>typeof line==='string'&&line.trim())&&
  (!unit.activities||(Array.isArray(unit.activities)&&unit.activities.every(item=>typeof item==='string'&&item.trim())))&&
  (unit.dialogue.length>0||Boolean(unit.activities?.length))&&
  Array.isArray(unit.vocabulary)&&unit.vocabulary.length>0&&unit.vocabulary.every(word=>typeof word==='string'&&word.trim())&&
  (unit.editorialStatus==='candidate'||unit.editorialStatus==='reviewed'));
const availableSupport=(concept:SharedConcept,support:KnownLanguageSupport|undefined):boolean=>
 Boolean(support&&support.conceptId===concept.id&&targetLanguages.includes(support.knownLanguage)&&
  typeof support.instructions==='string'&&support.instructions.trim()&&
  (support.editorialStatus==='candidate'||support.editorialStatus==='reviewed'));

/** A coverage candidate requires the actual unit and the actual known-language support. */
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
  const validUnit=availableUnit(concept,unit);
  const validSupport=availableSupport(concept,support);
  const state:CoverageState=composed?'candidate':!validUnit&&!validSupport?'missing-both':!validUnit?'missing-target':'missing-support';
  cells.push({knownLanguage,targetLanguage,state,structurallyComposable:Boolean(composed),readyForPublicRelease:false});
 }
 const candidatePairs=cells.filter(c=>c.structurallyComposable).length;
 return {conceptId:concept.id,level:concept.level,totalPairs:cells.length,candidatePairs,missingPairs:cells.length-candidatePairs,cells};
}
