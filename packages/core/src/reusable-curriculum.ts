/** Language-neutral curriculum composition contract. Editorial only until independently cleared. */
import {targetLanguages,type TargetLanguage,type CefrBand} from './types.js';

export type CurriculumSkill='listening'|'speaking'|'reading'|'writing'|'interaction'|'mediation';
export type CurriculumRelease='candidate'|'reviewed';
export interface SharedConcept {
 id:string;
 level:CefrBand;
 goal:string;
 prerequisites:readonly string[];
 skills:readonly CurriculumSkill[];
}
export interface TargetLanguageUnit {
 conceptId:string;
 targetLanguage:TargetLanguage;
 dialogue:readonly string[];
 vocabulary:readonly string[];
 editorialStatus:CurriculumRelease;
 rightsCleared:boolean;
 audioReviewed:boolean;
}
export interface KnownLanguageSupport {
 conceptId:string;
 knownLanguage:TargetLanguage;
 instructions:string;
 editorialStatus:CurriculumRelease;
}
export interface PairSpecificNote {
 conceptId:string;
 knownLanguage:TargetLanguage;
 targetLanguage:TargetLanguage;
 note:string;
 editorialStatus:CurriculumRelease;
}
/** Pair notes are optional enhancements, not a separate curriculum per language pair. */
export function composeCurriculumCandidate(
 concept:SharedConcept,
 unit:TargetLanguageUnit,
 support:KnownLanguageSupport,
 pairNotes:readonly PairSpecificNote[]=[]
){
 if(!targetLanguages.includes(unit.targetLanguage)||!targetLanguages.includes(support.knownLanguage))return null;
 if(unit.targetLanguage===support.knownLanguage||concept.id!==unit.conceptId||concept.id!==support.conceptId)return null;
 if(!concept.id.trim()||!concept.goal.trim()||!unit.dialogue.length||!unit.vocabulary.length||!support.instructions.trim())return null;
 const notes=pairNotes.filter(n=>n.conceptId===concept.id&&n.knownLanguage===support.knownLanguage&&n.targetLanguage===unit.targetLanguage);
 /** Candidate composition cannot authorize publication, even if incoming flags claim review. */
 const readyForPublicRelease=false as const;
 return {conceptId:concept.id,level:concept.level,goal:concept.goal,skills:concept.skills,
  knownLanguage:support.knownLanguage,targetLanguage:unit.targetLanguage,
  dialogue:unit.dialogue,vocabulary:unit.vocabulary,instructions:support.instructions,
  contrastiveNotes:notes.map(n=>n.note),readyForPublicRelease,
  status:'candidate' as const};
}
