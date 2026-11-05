/** Pure C1/C2 editorial rehearsal path. This is NOT a learner lesson.
 * It introduces no recording, network, TTS, scores, mastery, persistent progress
 * or playback side effects. A caller may render the steps for internal QA.
 */
import {advancedStoryboardPreview,type AdvancedListeningCheck} from './advanced-listening-storyboards.js';
import type {AdvancedLevel} from './advanced-editorial-contract.js';
import type {TargetLanguage} from './types.js';
import type {AdvancedAudioIntegrityReport} from './advanced-audio-integrity.js';

export type AdvancedRehearsalStep=
 | {kind:'script-turn';id:string;index:number;total:10;
    speaker:'speaker-a'|'speaker-b';text:string;audioId:string;
    verifiedLocalAudioRequest:false}
 | {kind:'evidence-question';id:string;index:number;total:10;
    question:string;evidenceRevealed:boolean;
    evidence?:string;supportedInterpretation?:string;unsupportedInterpretation?:string}
 | {kind:'follow-up';id:'follow-up';index:9;total:10;
    spokenPrompt:string;withoutMicrophone:string}
 | {kind:'complete';id:'complete';index:10;total:10;
    recordedProgress:false;certification:false};
export interface AdvancedRehearsalState {
 status:'editorial-only';sceneId:string;
 knownLanguage:TargetLanguage;targetLanguage:TargetLanguage;
 level:AdvancedLevel;unitId:string;
 cursor:number;revealEvidence:boolean;closed:boolean;
 recordedProgress:false;
}
/** One click-free representation, useful for an offline review UI.
 * Every second dialogue turn is followed by a non-scored evidence question.
 */
function stepsFor(
 scene:NonNullable<ReturnType<typeof advancedStoryboardPreview>>
):readonly {kind:'script-turn'|'evidence-question'|'follow-up';turnIndex?:number;checkIndex?:number}[]{
 const steps:{kind:'script-turn'|'evidence-question'|'follow-up';turnIndex?:number;checkIndex?:number}[]=[];
 scene.turns.forEach((_,turnIndex)=>{
  steps.push({kind:'script-turn',turnIndex});
  if(turnIndex%2===1)steps.push({kind:'evidence-question',checkIndex:(turnIndex-1)/2});
 });
 steps.push({kind:'follow-up'});
 return steps;
}
export function startAdvancedRehearsal(
 knownLanguage:TargetLanguage,targetLanguage:TargetLanguage,
 level:AdvancedLevel,unitId:string
):AdvancedRehearsalState|null{
 const scene=advancedStoryboardPreview(knownLanguage,targetLanguage,level,unitId);
 if(!scene||scene.publicAvailable!==false||scene.canAssess!==false||
   scene.verifiedAudioTurns!==0)return null;
 return {status:'editorial-only',sceneId:scene.sceneId,knownLanguage,targetLanguage,
  level,unitId,cursor:0,revealEvidence:false,closed:false,recordedProgress:false};
}
const validState=(state:unknown):state is AdvancedRehearsalState=>{
 if(!state||typeof state!=='object'||Array.isArray(state))return false;
 const value=state as Partial<AdvancedRehearsalState>;
 if(value.status!=='editorial-only'||value.recordedProgress!==false||
    typeof value.cursor!=='number'||!Number.isInteger(value.cursor)||
    value.cursor<0||value.cursor>10||typeof value.revealEvidence!=='boolean'||
    typeof value.closed!=='boolean')return false;
 const scene=advancedStoryboardPreview(
  value.knownLanguage as TargetLanguage,value.targetLanguage as TargetLanguage,
  value.level as AdvancedLevel,String(value.unitId));
 return !!scene&&scene.sceneId===value.sceneId;
};
/** Expose no answer key until explicitly requested. Even after reveal, no scoring. */
export function advancedRehearsalCurrent(input:unknown):AdvancedRehearsalStep|null{
 if(!validState(input))return null;
 const state=input;
 if(state.closed||state.cursor===10)return {
  kind:'complete',id:'complete',index:10,total:10,recordedProgress:false,certification:false
 };
 const scene=advancedStoryboardPreview(state.knownLanguage,state.targetLanguage,state.level,state.unitId)!;
 const steps=stepsFor(scene),item=steps[state.cursor];
 if(!item)return null;
 if(item.kind==='script-turn'){
  const turn=scene.turns[item.turnIndex!]!;
  return {kind:'script-turn',id:turn.id,index:state.cursor,total:10,
   speaker:turn.speaker,text:turn.text,audioId:turn.audioId,
   verifiedLocalAudioRequest:false};
 }
 if(item.kind==='evidence-question'){
  const check:AdvancedListeningCheck=scene.checks[item.checkIndex!]!;
  return {kind:'evidence-question',id:'check-'+(item.checkIndex!+1),
   index:state.cursor,total:10,question:check.question,
   evidenceRevealed:state.revealEvidence,
   ...(state.revealEvidence?{
    evidence:check.verbatimEvidence,
    supportedInterpretation:check.supportedInterpretation,
    unsupportedInterpretation:check.unsupportedInterpretation
   }:{})};
 }
 return {kind:'follow-up',id:'follow-up',index:9,total:10,
  spokenPrompt:scene.spokenFollowUp,withoutMicrophone:scene.noMicAlternative};
}
export type AdvancedRehearsalCommand='next'|'reveal'|'restart'|'stop';
/** A text-only editor progression control. Never accepts transcripts or stores them. */
export function advanceAdvancedRehearsal(
 state:unknown,command:AdvancedRehearsalCommand
):AdvancedRehearsalState|null{
 if(!validState(state)||!['next','reveal','restart','stop'].includes(command))return null;
 if(command==='stop')return {...state,closed:true};
 if(command==='restart')return {...state,cursor:0,closed:false,revealEvidence:false};
 if(state.closed||state.cursor>=10)return state;
 if(command==='reveal'){
  return advancedRehearsalCurrent(state)?.kind==='evidence-question'
   ?{...state,revealEvidence:true}:state;
 }
 return {...state,cursor:Math.min(state.cursor+1,10),revealEvidence:false};
}
/** Only proposes the existing, *locally verified* asset identifier for an
 * internal audio reviewer. This is NOT a player, URI or release authorization.
 * Never persist the audit result as a trust token.
 */
export function advancedEditorialAudioRequest(
 state:unknown,audit:AdvancedAudioIntegrityReport|null
):{status:'verified-editorial-asset';audioId:string}|{status:'unavailable'}{
 const step=advancedRehearsalCurrent(state);
 if(step?.kind!=='script-turn'||!audit||audit.readyForPublicRelease!==false||
   audit.expected!==72||audit.rejected.length!==0||
   audit.verified!==audit.verifiedIds.length||
   audit.verified+audit.missing.length!==audit.expected||
   new Set(audit.verifiedIds).size!==audit.verified||
   audit.verifiedIds.some(id=>audit.missing.includes(id)))return {status:'unavailable'};
 const sceneId=(state as AdvancedRehearsalState).sceneId;
 const scene=audit.scenes.find(s=>s.sceneId===sceneId&&
  s.editorialAudioRehearsalReady&&s.verifiedTurns===6&&s.requiredTurns===6&&s.publicAvailable===false);
 const preview=advancedStoryboardPreview(
  (state as AdvancedRehearsalState).knownLanguage,
  (state as AdvancedRehearsalState).targetLanguage,
  (state as AdvancedRehearsalState).level,
  (state as AdvancedRehearsalState).unitId);
 if(!scene||!preview||preview.turns.some(turn=>!audit.verifiedIds.includes(turn.audioId))||
    !audit.verifiedIds.includes(step.audioId))return {status:'unavailable'};
 return {status:'verified-editorial-asset',audioId:step.audioId};
}
