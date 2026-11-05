/** C1/C2 first-release authoring contracts, never learner-ready content.
 * Original text drafts have no reviewed audio, rights clearance or CEFR certification.
 * This module is not imported by sessions, scoring, SQLite or lessonsFor.
 */
import {firstReleaseLanguages,canSelectFirstReleasePair} from './first-release-languages.js';
import {curriculumUnitBlueprint,courseSkills,auditCurriculumProduction,type ProductionUnit} from './learning-paths.js';
import type {TargetLanguage} from './types.js';
import {c1English} from './advanced-c1-en.js';
import {c1French} from './advanced-c1-fr.js';
import {c1Spanish} from './advanced-c1-es.js';
import {c2English} from './advanced-c2-en.js';
import {c2French} from './advanced-c2-fr.js';
import {c2Spanish} from './advanced-c2-es.js';

export type AdvancedLevel='C1'|'C2';
type FirstTarget=(typeof firstReleaseLanguages)[number];
/** A substantive inference and a deliberately unsupported reading are
 * editorial prompts, NOT automatically scored answers or psychometric keys. */
export type AdvancedSeed=readonly [
 question:string,reply:string,listeningQuestion:string,explicitEvidence:string,
 supportedInference:string,rejectedInference:string,pragmaticDevice:string,
 outcome:string
];
const authored:Readonly<Record<AdvancedLevel,Readonly<Record<FirstTarget,readonly AdvancedSeed[]>>>>={
 C1:{'en-CA':c1English,'fr-CA':c1French,es:c1Spanish},
 C2:{'en-CA':c2English,'fr-CA':c2French,es:c2Spanish}
};
const teachingCopy:Readonly<Record<FirstTarget,readonly [string,string,string,string,string,string]>>={
 'en-CA':[
  'Listen for the exact phrase that supports the answer, without guessing.',
  'Give an oral interpretation and qualify what cannot be known.',
  'Read the exchange and distinguish explicit words from implied meaning.',
  'Optionally write a fictional reformulation preserving the certainty level.',
  'Take another turn and politely challenge a possible overinterpretation.',
  'Explain the evidence and its limits for a different listener.'
 ],
 'fr-CA':[
  'Écoutez pour relever la formulation exacte, sans deviner.',
  'Formulez oralement une interprétation et ses réserves.',
  'Lisez le dialogue en distinguant les mots et les sous-entendus.',
  'Rédigez facultativement une reformulation fictive et nuancée.',
  'Poursuivez l’échange et questionnez une conclusion hâtive.',
  'Présentez les indices et leurs limites à une autre personne.'
 ],
 es:[
  'Escucha y localiza la frase exacta sin adivinar.',
  'Expón oralmente una interpretación indicando sus límites.',
  'Lee el diálogo y distingue lo dicho de lo insinuado.',
  'Redacta opcionalmente una reformulación ficticia y matizada.',
  'Continúa el intercambio y cuestiona una inferencia excesiva.',
  'Explica la evidencia y sus límites a otra persona.'
 ]
};
export interface AdvancedEditorialDraft extends ProductionUnit {
 level:AdvancedLevel;status:'draft';
 dialogue:readonly [string,string];
 listeningQuestion:string;explicitEvidence:string;
 supportedInference:string;rejectedInference:string;pragmaticDevice:string;
 editorialStatus:'not-human-reviewed';audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';publicAvailable:false;
}
export const advancedEditorialDrafts:readonly AdvancedEditorialDraft[]=
 (['C1','C2'] as const).flatMap(level=>firstReleaseLanguages.flatMap(targetLanguage=>
  curriculumUnitBlueprint[level].map((unitId,i):AdvancedEditorialDraft=>{
   const seed=authored[level][targetLanguage][i]!;
   const [question,reply,listeningQuestion,explicitEvidence,supportedInference,
    rejectedInference,pragmaticDevice,outcome]=seed;
   return {
    targetLanguage,level,unitId,status:'draft',revision:'0.1.0',
    outcomes:[outcome],dialogue:[question,reply],
    listeningQuestion,explicitEvidence,supportedInference,rejectedInference,pragmaticDevice,
    activities:courseSkills.map((skill,index)=>({
     id:'activity-'+skill,skill,
     prompt:teachingCopy[targetLanguage][index]+' Topic: '+outcome
    })),
    editorialStatus:'not-human-reviewed',audioStatus:'not-recorded',
    rightsStatus:'pending-editorial-clearance',publicAvailable:false
   };
  })
 ));
export const advancedAudioExpectedIds:readonly string[]=advancedEditorialDrafts.flatMap(item=>
 item.dialogue.map((_,i)=>[item.targetLanguage,item.level.toLowerCase(),
  item.unitId,'dialogue-'+(i+1)].join('/')));
export const advancedAudioBaseline={
 expected:advancedAudioExpectedIds.length,verified:0,missing:advancedAudioExpectedIds,
 readyForEditorialPlayback:false,readyForPublicRelease:false
} as const;
/** Route-aware editorial preview, NEVER playable audio or assessment. */
export function advancedLocalizedPreview(
 known:TargetLanguage,target:TargetLanguage,level:AdvancedLevel,unitId:string
){
 if(!canSelectFirstReleasePair(known,target)||!['C1','C2'].includes(level)||
  !(curriculumUnitBlueprint[level] as readonly string[]).includes(unitId))return null;
 const unit=advancedEditorialDrafts.find(row=>
  row.targetLanguage===target&&row.level===level&&row.unitId===unitId);
 if(!unit||unit.editorialStatus!=='not-human-reviewed'||unit.audioStatus!=='not-recorded'||
   unit.rightsStatus!=='pending-editorial-clearance'||unit.publicAvailable!==false)return null;
 return {
  status:'editorial-only' as const,knownLanguage:known,targetLanguage:target,level,unitId,
  dialogue:unit.dialogue,listeningQuestion:unit.listeningQuestion,
  explicitEvidence:unit.explicitEvidence,supportedInference:unit.supportedInference,
  rejectedInference:unit.rejectedInference,pragmaticDevice:unit.pragmaticDevice,
  outcome:unit.outcomes[0]!,instructions:teachingCopy[known as FirstTarget],
  publicAvailable:false as const,readyForListening:false as const,
  readyForAssessment:false as const,readyForCertification:false as const
 };
}
const invalidReport=(errors:readonly string[])=>({
 valid:false,errors,plannedFirstReleaseUnits:48,actualDrafts:0,
 approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false as const
});
/** A structure check, NOT a human linguistic review or proficiency validation. */
export function auditAdvancedEditorialDrafts(input:unknown=advancedEditorialDrafts){
 const generic=auditCurriculumProduction(input);
 if(!Array.isArray(input)||input.length>144)return invalidReport(generic.errors);
 const errors=[...generic.errors],seen=new Set<string>(),dialogues=new Set<string>();
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){
   errors.push('INVALID_ADVANCED_ROW');continue;
  }
  const row=raw as Partial<AdvancedEditorialDraft>;
  const id=String(row.targetLanguage)+'/'+String(row.level)+'/'+String(row.unitId);
  if(seen.has(id))errors.push('DUPLICATE_ADVANCED '+id);
  seen.add(id);
  if(!firstReleaseLanguages.includes(row.targetLanguage as FirstTarget)||
    (row.level!=='C1'&&row.level!=='C2')||
    !(row.level==='C1'||row.level==='C2'?curriculumUnitBlueprint[row.level] as readonly string[]:[]).includes(row.unitId||'')||
    row.status!=='draft')errors.push('WRONG_ADVANCED_SCOPE '+id);
  if(row.publicAvailable!==false||row.editorialStatus!=='not-human-reviewed'||
    row.audioStatus!=='not-recorded'||row.rightsStatus!=='pending-editorial-clearance'||
    row.review!==undefined)errors.push('PREMATURE_ADVANCED_PUBLICATION '+id);
  if(!Array.isArray(row.dialogue)||row.dialogue.length!==2||
    row.dialogue.some(text=>typeof text!=='string'||text.trim().length<35)||
    !Array.isArray(row.outcomes)||row.outcomes.length!==1||
    typeof row.outcomes[0]!=='string'||row.outcomes[0].length<35)
    errors.push('INCOMPLETE_ADVANCED_DIALOGUE '+id);
  if(typeof row.listeningQuestion!=='string'||row.listeningQuestion.trim().length<15||
    typeof row.explicitEvidence!=='string'||row.explicitEvidence.trim().length<8||
    !row.dialogue?.[1]?.includes(row.explicitEvidence))
    errors.push('UNGROUNDED_ADVANCED_EVIDENCE '+id);
  if(typeof row.supportedInference!=='string'||row.supportedInference.trim().length<30||
    typeof row.rejectedInference!=='string'||row.rejectedInference.trim().length<30||
    row.supportedInference===row.rejectedInference||
    typeof row.pragmaticDevice!=='string'||row.pragmaticDevice.trim().length<8)
    errors.push('INCOMPLETE_ADVANCED_PRAGMATICS '+id);
  if(!Array.isArray(row.activities)||row.activities.length!==6||
    !courseSkills.every(skill=>row.activities?.filter(a=>
     a.skill===skill&&typeof a.prompt==='string'&&a.prompt.length>=35).length===1))
    errors.push('INCOMPLETE_ADVANCED_SKILLS '+id);
  if(Array.isArray(row.dialogue)&&row.dialogue.length===2){
   const key=String(row.targetLanguage)+'/'+row.dialogue.join('|');
   if(dialogues.has(key))errors.push('REUSED_ADVANCED_DIALOGUE '+id);
   dialogues.add(key);
  }
 }
 for(const target of firstReleaseLanguages)for(const level of ['C1','C2'] as const)
  for(const topic of curriculumUnitBlueprint[level])
   if(!seen.has(target+'/'+level+'/'+topic))
    errors.push('MISSING_ADVANCED_DRAFT '+target+'/'+level+'/'+topic);
 return {
  valid:errors.length===0,errors,plannedFirstReleaseUnits:48,actualDrafts:input.length,
  approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false as const
 };
}
