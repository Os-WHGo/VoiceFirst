/** A1 scenarios authored in three launch languages. B0 editorial QA only.
 * They extend existing two-turn scenes without rewriting their origins.
 * No audio, ASR, achievement, persistence, download or publishing.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
import {a1SituationsEnglish} from './a1-situations-en.js';
import {a1SituationsFrench} from './a1-situations-fr.js';
import {a1SituationsSpanish} from './a1-situations-es.js';
type LaunchLanguage=(typeof firstReleaseLanguages)[number];
export const a1SituationTopics=['personal-information','food-and-shopping','places-and-directions'] as const;
export type A1SituationTopic=(typeof a1SituationTopics)[number];
export interface A1SituationSeed{
 continuation:readonly [string,string,string,string];
 checks:readonly [
  readonly [string,string,string],
  readonly [string,string,string],
  readonly [string,string,string]
 ];
 spokenFollowUp:string;noMicAlternative:string;mediationPrompt:string;
}
const seeds:Readonly<Record<LaunchLanguage,Readonly<Record<A1SituationTopic,A1SituationSeed>>>>={
 'en-CA':a1SituationsEnglish,'fr-CA':a1SituationsFrench,es:a1SituationsSpanish
};
export interface A1SituationScene{
 sceneId:string;level:'A1';unitId:A1SituationTopic;targetLanguage:LaunchLanguage;
 grammarFocus:string;
 turns:readonly {id:string;speaker:'a'|'b';text:string;audioId:string}[];
 checks:readonly {
  afterTurnId:string;question:string;verbatimEvidence:string;
  unsupportedInterpretation:string
 }[];
 spokenFollowUp:string;noMicAlternative:string;mediationPrompt:string;
 editorialStatus:'not-human-reviewed';audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';publicAvailable:false;
 canScore:false;canCertify:false;
}
const getId=(locale:string,unit:string)=>[locale,'A1',unit].join('/');
export const expandedA1SituationalPilots:readonly A1SituationScene[]=
 firstReleaseLanguages.flatMap(targetLanguage=>a1SituationTopics.map(unitId=>{
  const draft=a1EditorialDrafts.find(d=>d.targetLanguage===targetLanguage&&d.unitId===unitId);
  if(!draft)throw new Error('Missing existing A1 source '+getId(targetLanguage,unitId));
  const seed=seeds[targetLanguage][unitId];
  const lines=[...draft.dialogue,...seed.continuation];
  return {
   sceneId:getId(targetLanguage,unitId),
   targetLanguage,level:'A1' as const,unitId,grammarFocus:draft.grammarFocus,
   turns:lines.map((text,i)=>({
    id:'turn-'+(i+1),speaker:i%2===0?'a' as const:'b' as const,
    text,audioId:[targetLanguage,'a1',unitId,'turn-'+(i+1)].join('/')
   })),
   checks:seed.checks.map(([question,verbatimEvidence,unsupportedInterpretation],i)=>({
    afterTurnId:'turn-'+(2*i+2),question,verbatimEvidence,unsupportedInterpretation
   })),
   spokenFollowUp:seed.spokenFollowUp,noMicAlternative:seed.noMicAlternative,
   mediationPrompt:seed.mediationPrompt,
   editorialStatus:'not-human-reviewed' as const,audioStatus:'not-recorded' as const,
   rightsStatus:'pending-editorial-clearance' as const,
   publicAvailable:false as const,canScore:false as const,canCertify:false as const
  };
 }));
export const a1SituationalAudioIds:readonly string[]=
 expandedA1SituationalPilots.flatMap(s=>s.turns.map(t=>t.audioId));
/** A separate source-bound audit catches tampered scene IDs, lost punctuation,
 * duplicated audio cues, fabricated answer evidence and forged approvals.
 * SHA alone is insufficient because it can be recomputed over altered data.
 */
export function auditExpandedA1SituationalPilots(input:unknown=expandedA1SituationalPilots){
 const errors:string[]=[],seenScenes=new Set<string>(),seenAudio=new Set<string>();
 if(!Array.isArray(input)||input.length!==9)return{
  valid:false,errors:['INVALID_A1_SITUATION_COUNT'],scenes:0,
  turns:0,checks:0,approvedAudio:0,availableToLearners:false as const
 };
 let turns=0,checks=0;
 for(const raw of input){
  if(raw===null||typeof raw!=='object'||Array.isArray(raw)){
   errors.push('INVALID_A1_SITUATION_ROW');continue;
  }
  const scene=raw as Partial<A1SituationScene>,id=String(scene.sceneId);
  const locale=scene.targetLanguage,topic=scene.unitId;
  const known=firstReleaseLanguages.includes(locale as LaunchLanguage)&&
   a1SituationTopics.includes(topic as A1SituationTopic);
  if(!known||id!==getId(String(locale),String(topic))||seenScenes.has(id))
   errors.push('DUPLICATE_OR_UNKNOWN_A1_SCENE '+id);
  seenScenes.add(id);
  const draft=a1EditorialDrafts.find(d=>d.targetLanguage===locale&&d.unitId===topic);
  const turnsArray=Array.isArray(scene.turns)?scene.turns:[];
  const checksArray=Array.isArray(scene.checks)?scene.checks:[];
  turns+=turnsArray.length;checks+=checksArray.length;
  if(!draft||scene.level!=='A1'||turnsArray.length!==6||checksArray.length!==3||
    turnsArray[0]?.text!==draft?.dialogue[0]||turnsArray[1]?.text!==draft?.dialogue[1]||
    scene.grammarFocus!==draft?.grammarFocus)
   errors.push('ALTERED_A1_SOURCE '+id);
  turnsArray.forEach((turn,i)=>{
   if(!turn||typeof turn!=='object'||turn.id!=='turn-'+(i+1)||
      turn.speaker!==(i%2===0?'a':'b')||typeof turn.text!=='string'||
      turn.text.trim().length<12||turn.text.length>450||
      turn.audioId!==[locale,'a1',topic,'turn-'+(i+1)].join('/')||
      seenAudio.has(String(turn.audioId)))
    errors.push('INVALID_A1_TURN '+id+'/'+i);
   if(turn&&typeof turn.audioId==='string')seenAudio.add(turn.audioId);
  });
  checksArray.forEach((check,i)=>{
   const turn=turnsArray[i*2+1];
   if(!check||typeof check!=='object'||check.afterTurnId!=='turn-'+(i*2+2)||
      typeof check.question!=='string'||check.question.trim().length<20||
      typeof check.verbatimEvidence!=='string'||check.verbatimEvidence.length<8||
      typeof turn?.text!=='string'||!turn.text.includes(check.verbatimEvidence)||
      typeof check.unsupportedInterpretation!=='string'||
      check.unsupportedInterpretation.trim().length<25||
      check.unsupportedInterpretation===check.verbatimEvidence)
    errors.push('UNGROUNDED_A1_CHECK '+id+'/'+i);
  });
  if(scene.publicAvailable!==false||scene.canScore!==false||
     scene.canCertify!==false||scene.audioStatus!=='not-recorded'||
     scene.editorialStatus!=='not-human-reviewed'||
     scene.rightsStatus!=='pending-editorial-clearance')
    errors.push('FAKE_A1_APPROVAL '+id);
  if(typeof scene.spokenFollowUp!=='string'||scene.spokenFollowUp.trim().length<65||
     typeof scene.noMicAlternative!=='string'||scene.noMicAlternative.trim().length<65||
     typeof scene.mediationPrompt!=='string'||scene.mediationPrompt.trim().length<65)
    errors.push('INCOMPLETE_A1_PRACTICE '+id);
 }
 for(const locale of firstReleaseLanguages)for(const topic of a1SituationTopics){
  const id=getId(locale,topic);if(!seenScenes.has(id))errors.push('MISSING_A1_SCENE '+id);
 }
 return {valid:errors.length===0,errors,scenes:input.length,turns,checks,
  approvedAudio:0,availableToLearners:false as const};
}
