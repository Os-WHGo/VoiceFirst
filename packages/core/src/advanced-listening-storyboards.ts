/** Advanced six-turn editorial storyboards for voice-first learning.
 * Existing lesson and voice-session engines are NOT modified here. Text alone
 * cannot establish audio availability, language review or listening proficiency.
 */
import {firstReleaseLanguages,canSelectFirstReleasePair} from './first-release-languages.js';
import {curriculumUnitBlueprint} from './learning-paths.js';
import {advancedEditorialDrafts,type AdvancedLevel} from './advanced-editorial-contract.js';
import type {TargetLanguage} from './types.js';
import {c1ListeningEnglish} from './advanced-scene-c1-en.js';
import {c1ListeningFrench} from './advanced-scene-c1-fr.js';
import {c1ListeningSpanish} from './advanced-scene-c1-es.js';
import {c2ListeningEnglish} from './advanced-scene-c2-en.js';
import {c2ListeningFrench} from './advanced-scene-c2-fr.js';
import {c2ListeningSpanish} from './advanced-scene-c2-es.js';

type FirstTarget=(typeof firstReleaseLanguages)[number];
export type AdvancedSpeaker='speaker-a'|'speaker-b';
export type AdvancedSceneTurnSeed=readonly [AdvancedSpeaker,string];
/** afterIndex is a zero-based 1/3/5 checkpoint into a six-turn scene. */
export type AdvancedSceneCheckSeed=readonly [
 afterIndex:number,question:string,verbatimEvidence:string,
 supportedInterpretation:string,unsupportedInterpretation:string
];
export interface AdvancedSceneSeed {
 level:AdvancedLevel;unitId:string;title:string;context:string;
 turns:readonly AdvancedSceneTurnSeed[];
 checks:readonly AdvancedSceneCheckSeed[];
 spokenFollowUp:string;noMicAlternative:string;
}
export const advancedStoryboardTopics={
 C1:['nuance-and-register','implicit-meaning'],
 C2:['idiomatic-mastery','subtle-implications']
} as const;
const sources:Readonly<Record<FirstTarget,readonly AdvancedSceneSeed[]>>={
 'en-CA':[...c1ListeningEnglish,...c2ListeningEnglish],
 'fr-CA':[...c1ListeningFrench,...c2ListeningFrench],
 es:[...c1ListeningSpanish,...c2ListeningSpanish]
};
export interface AdvancedListeningTurn {
 id:string;speaker:AdvancedSpeaker;text:string;audioId:string;
}
export interface AdvancedListeningCheck {
 afterTurnId:string;question:string;verbatimEvidence:string;
 supportedInterpretation:string;unsupportedInterpretation:string;
}
export interface AdvancedListeningStoryboard {
 sceneId:string;level:AdvancedLevel;unitId:string;targetLanguage:FirstTarget;
 title:string;context:string;
 turns:readonly AdvancedListeningTurn[];checks:readonly AdvancedListeningCheck[];
 spokenFollowUp:string;noMicAlternative:string;
 status:'draft';editorialStatus:'not-human-reviewed';
 audioStatus:'not-recorded';rightsStatus:'pending-editorial-clearance';
 publicAvailable:false;canScore:false;canCertify:false;
}
export const advancedListeningStoryboards:readonly AdvancedListeningStoryboard[]=
 firstReleaseLanguages.flatMap(targetLanguage=>sources[targetLanguage].map(seed=>({
  sceneId:[targetLanguage,seed.level,seed.unitId].join('/'),
  targetLanguage,level:seed.level,unitId:seed.unitId,title:seed.title,
  context:seed.context,
  turns:seed.turns.map(([speaker,text],index)=>({
   id:'turn-'+(index+1),speaker,text,
   audioId:[targetLanguage,seed.level.toLowerCase(),seed.unitId,'turn-'+(index+1)].join('/')
  })),
  checks:seed.checks.map(([afterIndex,question,verbatimEvidence,supportedInterpretation,
   unsupportedInterpretation])=>({
   afterTurnId:'turn-'+(afterIndex+1),question,verbatimEvidence,
   supportedInterpretation,unsupportedInterpretation
  })),
  spokenFollowUp:seed.spokenFollowUp,noMicAlternative:seed.noMicAlternative,
  status:'draft' as const,editorialStatus:'not-human-reviewed' as const,
  audioStatus:'not-recorded' as const,rightsStatus:'pending-editorial-clearance' as const,
  publicAvailable:false as const,canScore:false as const,canCertify:false as const
 })));
export const advancedStoryboardExpectedAudioIds:readonly string[]=
 advancedListeningStoryboards.flatMap(scene=>scene.turns.map(turn=>turn.audioId));
export const advancedStoryboardAudioBaseline={
 expected:advancedStoryboardExpectedAudioIds.length,verified:0,
 missing:advancedStoryboardExpectedAudioIds,
 readyForListening:false,readyForPublicRelease:false
} as const;
const helpCopy:Readonly<Record<FirstTarget,{instruction:string;fallback:string}>>={
 'en-CA':{
  instruction:'Editorial script only: identify what the speakers said and what is merely inferred. Audio is not recorded.',
  fallback:'For a no-microphone activity, read the scene and respond in writing. This is not assessed.'
 },
 'fr-CA':{
  instruction:'Scénario éditorial uniquement : distinguez les propos explicites des inférences. Aucun audio enregistré.',
  fallback:'Sans microphone, lisez la scène et répondez par écrit. Cet exercice n’est pas évalué.'
 },
 es:{
  instruction:'Guion editorial: distingue las palabras expresas de las inferencias. Todavía no existe audio grabado.',
  fallback:'Sin micrófono, lee la escena y responde por escrito. Esta actividad no se califica.'
 }
};
/** A planning preview, never a playable lesson or a source of learner progress. */
export function advancedStoryboardPreview(
 known:TargetLanguage,target:TargetLanguage,level:AdvancedLevel,unitId:string
){
 if(!canSelectFirstReleasePair(known,target)||(level!=='C1'&&level!=='C2')||
  !(advancedStoryboardTopics[level] as readonly string[]).includes(unitId))return null;
 const row=advancedListeningStoryboards.find(scene=>
  scene.targetLanguage===target&&scene.level===level&&scene.unitId===unitId);
 if(!row||row.publicAvailable!==false||row.editorialStatus!=='not-human-reviewed'||
  row.audioStatus!=='not-recorded'||row.rightsStatus!=='pending-editorial-clearance')return null;
 return {
  status:'editorial-only' as const,knownLanguage:known,targetLanguage:target,
  sceneId:row.sceneId,title:row.title,context:row.context,level,unitId,
  turns:row.turns,checks:row.checks,spokenFollowUp:row.spokenFollowUp,
  noMicAlternative:row.noMicAlternative,help:helpCopy[known as FirstTarget],
  verifiedAudioTurns:0 as const,canPlayAudio:false as const,
  canAssess:false as const,canAwardProgress:false as const,
  publicAvailable:false as const
 };
}
const isObject=(raw:unknown):raw is Record<string,unknown> =>
 Boolean(raw)&&typeof raw==='object'&&!Array.isArray(raw);
const intended=firstReleaseLanguages.flatMap(targetLanguage=>
 (['C1','C2'] as const).flatMap(level=>
  advancedStoryboardTopics[level].map(unitId=>[targetLanguage,level,unitId].join('/'))));
/** Structural only: checks evidence anchors and prevents accidental promotion. */
export function auditAdvancedListeningStoryboards(input:unknown=advancedListeningStoryboards){
 const errors:string[]=[],seen=new Set<string>(),audioIds=new Set<string>();
 if(!Array.isArray(input)||input.length>48){
  return {valid:false,errors:['INVALID_STORYBOARD_INVENTORY'],expectedScenes:12,
   actualScenes:0,scriptedAudioTurns:0,editorialChecks:0,
   humanReviewed:0,verifiedAudioTurns:0,readyForPublicRelease:false as const};
 }
 let turnsCount=0,checkCount=0;
 for(const raw of input){
  if(!isObject(raw)){errors.push('INVALID_STORYBOARD_ROW');continue;}
  const row=raw as unknown as Partial<AdvancedListeningStoryboard>;
  const id=String(row.sceneId);
  if(!intended.includes(id)||seen.has(id)||id!==[row.targetLanguage,row.level,row.unitId].join('/'))
   errors.push('INVALID_OR_DUPLICATE_STORYBOARD '+id);
  seen.add(id);
  if(!firstReleaseLanguages.includes(row.targetLanguage as FirstTarget)||
   (row.level!=='C1'&&row.level!=='C2')||
   !(row.level==='C1'||row.level==='C2'?
     curriculumUnitBlueprint[row.level] as readonly string[]:[]).includes(row.unitId||'')||
   !advancedEditorialDrafts.some(u=>u.targetLanguage===row.targetLanguage&&
    u.level===row.level&&u.unitId===row.unitId&&u.publicAvailable===false))
   errors.push('UNKNOWN_ADVANCED_DRAFT '+id);
  if(row.status!=='draft'||row.editorialStatus!=='not-human-reviewed'||
   row.audioStatus!=='not-recorded'||row.rightsStatus!=='pending-editorial-clearance'||
   row.publicAvailable!==false||row.canScore!==false||row.canCertify!==false)
   errors.push('PREMATURE_STORYBOARD_PROMOTION '+id);
  if(typeof row.title!=='string'||row.title.trim().length<12||
   typeof row.context!=='string'||row.context.trim().length<30||
   typeof row.spokenFollowUp!=='string'||row.spokenFollowUp.trim().length<35||
   typeof row.noMicAlternative!=='string'||row.noMicAlternative.trim().length<35)
   errors.push('INCOMPLETE_STORYBOARD_CONTEXT '+id);
  const turns=Array.isArray(row.turns)?row.turns:[];
  turnsCount+=turns.length;
  if(turns.length!==6)errors.push('INCOMPLETE_STORYBOARD_TURNS '+id);
  for(const [index,turn] of turns.entries()){
   if(!isObject(turn)||turn.id!=='turn-'+(index+1)||
    turn.speaker!==(index%2===0?'speaker-a':'speaker-b')||
    typeof turn.text!=='string'||turn.text.trim().length<50||turn.text.length>700||
    turn.audioId!==[row.targetLanguage,String(row.level).toLowerCase(),row.unitId,turn.id].join('/')||
    audioIds.has(String(turn.audioId)))errors.push('INVALID_STORYBOARD_TURN '+id+'/'+index);
   if(isObject(turn)&&typeof turn.audioId==='string')audioIds.add(turn.audioId);
  }
  const checks=Array.isArray(row.checks)?row.checks:[];
  checkCount+=checks.length;
  if(checks.length!==3)errors.push('INCOMPLETE_STORYBOARD_CHECKS '+id);
  for(const [index,check] of checks.entries()){
   const turn=turns[(index+1)*2-1];
   if(!isObject(check)||check.afterTurnId!=='turn-'+((index+1)*2)||
    typeof check.question!=='string'||check.question.trim().length<20||
    typeof check.verbatimEvidence!=='string'||check.verbatimEvidence.trim().length<10||
    !isObject(turn)||typeof turn.text!=='string'||
    !turn.text.includes(check.verbatimEvidence)||
    typeof check.supportedInterpretation!=='string'||check.supportedInterpretation.trim().length<40||
    typeof check.unsupportedInterpretation!=='string'||check.unsupportedInterpretation.trim().length<40||
    check.supportedInterpretation===check.unsupportedInterpretation)
    errors.push('UNGROUNDED_OR_AMBIGUOUS_CHECK '+id+'/'+index);
  }
 }
 for(const id of intended)if(!seen.has(id))errors.push('MISSING_STORYBOARD '+id);
 return {valid:errors.length===0,errors,expectedScenes:12,actualScenes:input.length,
  scriptedAudioTurns:turnsCount,editorialChecks:checkCount,
  humanReviewed:0,verifiedAudioTurns:0,readyForPublicRelease:false as const};
}
