/** Expanded A2–B2 source-grounded listening dialogues for editorial QA.
 * The original two turns are imported unchanged from the existing authored
 * source; four NEW turns extend each scenario. Not a voice pack or exam.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {a2EditorialDrafts} from './a2-editorial-contract.js';
import {b1EditorialDrafts} from './b1-editorial-contract.js';
import {b2EditorialDrafts} from './b2-editorial-contract.js';
import {expandedPilotEnglish} from './a2-b2-expanded-en.js';
import {expandedPilotFrench} from './a2-b2-expanded-fr.js';
import {expandedPilotSpanish} from './a2-b2-expanded-es.js';
type FirstTarget=(typeof firstReleaseLanguages)[number];
export type PilotLevel='A2'|'B1'|'B2';
export interface ExpandedPilotSeed {
 unitId:string;continuation:readonly [string,string,string,string];
 checks:readonly [
  readonly [string,string,string],
  readonly [string,string,string],
  readonly [string,string,string]
 ];spokenFollowUp:string;noMicAlternative:string;
}
export interface ExpandedPilotTurn {
 id:string;speaker:'a'|'b';text:string;audioId:string;
}
export interface ExpandedPilotCheck{
 afterTurnId:string;question:string;verbatimEvidence:string;
 unsupportedInterpretation:string;
}
export interface ExpandedPilotScene{
 sceneId:string;level:PilotLevel;unitId:string;targetLanguage:FirstTarget;
 turns:readonly ExpandedPilotTurn[];checks:readonly ExpandedPilotCheck[];
 spokenFollowUp:string;noMicAlternative:string;
 editorialStatus:'not-human-reviewed';audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';publicAvailable:false;
 canScore:false;canCertify:false;
}
const seeds:Readonly<Record<FirstTarget,Readonly<Record<PilotLevel,ExpandedPilotSeed>>>>={
 'en-CA':expandedPilotEnglish,'fr-CA':expandedPilotFrench,es:expandedPilotSpanish
};
const originals=[...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts];
const originalsById=new Map(originals.map(x=>[[x.targetLanguage,x.level,x.unitId].join('/'),x]));
export const expandedFirstReleasePilots:readonly ExpandedPilotScene[]=firstReleaseLanguages.flatMap(targetLanguage=>
 (['A2','B1','B2'] as const).map(level=>{
  const seed=seeds[targetLanguage][level];
  const original=originalsById.get([targetLanguage,level,seed.unitId].join('/'));
  if(!original)throw new Error('Missing existing editorial source');
  const lines=[...original.dialogue,...seed.continuation];
  return {
   sceneId:[targetLanguage,level,seed.unitId].join('/'),
   targetLanguage,level,unitId:seed.unitId,
   turns:lines.map((text,i)=>({
    id:'turn-'+(i+1),speaker:i%2===0?'a' as const:'b' as const,
    text,audioId:[targetLanguage,level.toLowerCase(),seed.unitId,'turn-'+(i+1)].join('/')
   })),
   checks:seed.checks.map(([question,verbatimEvidence,unsupportedInterpretation],i)=>({
    afterTurnId:'turn-'+(2*i+2),question,verbatimEvidence,unsupportedInterpretation
   })),
   spokenFollowUp:seed.spokenFollowUp,noMicAlternative:seed.noMicAlternative,
   editorialStatus:'not-human-reviewed' as const,audioStatus:'not-recorded' as const,
   rightsStatus:'pending-editorial-clearance' as const,publicAvailable:false as const,
   canScore:false as const,canCertify:false as const
  };
 }));
export const expandedPilotExpectedAudioIds:readonly string[]=
 expandedFirstReleasePilots.flatMap(scene=>scene.turns.map(turn=>turn.audioId));
export function auditExpandedFirstReleasePilots(input:unknown=expandedFirstReleasePilots){
 const errors:string[]=[],seen=new Set<string>(),audioIds=new Set<string>();
 if(!Array.isArray(input)||input.length!==9)return {
  valid:false,errors:['INVALID_EXPANDED_PILOT_COUNT'],scenes:0,
  dialogueTurns:0,comprehensionChecks:0,verifiedAudio:0,
  availableToLearners:false as const
 };
 let turns=0,checks=0;
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){
   errors.push('MALFORMED_PILOT');continue;
  }
  const row=raw as Partial<ExpandedPilotScene>;
  const id=String(row.sceneId);
  const expected=firstReleaseLanguages.some(lang=>
   (['A2','B1','B2'] as const).some(level=>
    id===[lang,level,seeds[lang][level].unitId].join('/')));
  if(!expected||seen.has(id)||id!==[row.targetLanguage,row.level,row.unitId].join('/'))
   errors.push('UNKNOWN_OR_DUPLICATE_PILOT '+id);
  seen.add(id);
  if(row.editorialStatus!=='not-human-reviewed'||row.audioStatus!=='not-recorded'||
   row.rightsStatus!=='pending-editorial-clearance'||row.publicAvailable!==false||
   row.canScore!==false||row.canCertify!==false)errors.push('PREMATURE_PILOT_PROMOTION '+id);
  const original=originalsById.get(id);
  const t=Array.isArray(row.turns)?row.turns:[];
  const q=Array.isArray(row.checks)?row.checks:[];
  turns+=t.length;checks+=q.length;
  if(t.length!==6||q.length!==3||!original||
   t[0]?.text!==original.dialogue[0]||t[1]?.text!==original.dialogue[1])
   errors.push('INCOMPLETE_OR_CHANGED_PILOT '+id);
  t.forEach((turn,i)=>{
   if(!turn||typeof turn!=='object'||turn.id!=='turn-'+(i+1)||
    turn.speaker!==(i%2===0?'a':'b')||
    typeof turn.text!=='string'||turn.text.trim().length<24||
    turn.audioId!==[row.targetLanguage,String(row.level).toLowerCase(),row.unitId,turn.id].join('/')||
    audioIds.has(String(turn.audioId)))errors.push('INVALID_TURN '+id+'/'+i);
   if(turn&&typeof turn.audioId==='string')audioIds.add(turn.audioId);
  });
  q.forEach((check,i)=>{
   const tLine=t[2*i+1];
   if(!check||typeof check!=='object'||check.afterTurnId!=='turn-'+(2*i+2)||
    typeof check.question!=='string'||check.question.trim().length<14||
    typeof check.verbatimEvidence!=='string'||check.verbatimEvidence.trim().length<7||
    typeof tLine?.text!=='string'||!tLine.text.includes(check.verbatimEvidence)||
    typeof check.unsupportedInterpretation!=='string'||
    check.unsupportedInterpretation.trim().length<24)
    errors.push('UNGROUNDED_CHECK '+id+'/'+i);
  });
  if(typeof row.spokenFollowUp!=='string'||row.spokenFollowUp.length<55||
    typeof row.noMicAlternative!=='string'||row.noMicAlternative.length<55)
   errors.push('MISSING_FOLLOWUP '+id);
 }
 return {valid:errors.length===0,errors,scenes:input.length,
  dialogueTurns:turns,comprehensionChecks:checks,
  verifiedAudio:0,availableToLearners:false as const};
}
