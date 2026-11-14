/** Private, unscored A2–B2 system-TTS rehearsal plan for authored six-turn
 * scripts. NO recordings exist, no offline voice guarantee or pronunciation
 * grade. Not a course lesson, ASR transcript, persistent progress or exam.
 */
import {canSelectFirstReleasePair} from './first-release-languages.js';
import {expandedFirstReleasePilots,
 type ExpandedPilotScene,type ExpandedPilotCheck} from './a2-b2-expanded-pilots.js';
import {expandedSecondEditorialPilots} from './a2-b2-second-dialogue-pilots.js';
import {voiceLocales,type VoiceCue} from './voice-library.js';
import type {TargetLanguage} from './types.js';

const scenes=[...expandedFirstReleasePilots,...expandedSecondEditorialPilots];
export const a2B2EditorialRehearsalScenes:readonly ExpandedPilotScene[]=scenes;
export interface A2B2EditorialListeningTurn{
 index:number;audioId:string;cue:VoiceCue;reviewerOnly:true;
 recordedAudioAvailable:false;offlineGuaranteed:false;
 canAssessListening:false;canRecordProgress:false;publicAvailable:false;
}
export interface A2B2EditorialRehearsalPlan{
 sceneId:string;level:'A2'|'B1'|'B2';unitId:string;
 knownLanguage:TargetLanguage;targetLanguage:TargetLanguage;
 turns:readonly A2B2EditorialListeningTurn[];
 checks:readonly ExpandedPilotCheck[];
 spokenFollowUp:string;noMicAlternative:string;
 publicAvailable:false;canScore:false;canCertify:false;
}
export function planA2B2EditorialVoiceRehearsal(
 knownLanguage:TargetLanguage,targetLanguage:TargetLanguage,sceneId:string
):A2B2EditorialRehearsalPlan|null{
 if(!canSelectFirstReleasePair(knownLanguage,targetLanguage)||
    typeof sceneId!=='string')return null;
 const scene=scenes.find(s=>s.sceneId===sceneId);
 if(!scene||scene.targetLanguage!==targetLanguage||
  scene.editorialStatus!=='not-human-reviewed'||
  scene.audioStatus!=='not-recorded'||
  scene.rightsStatus!=='pending-editorial-clearance'||
  scene.publicAvailable!==false||scene.canScore!==false||
  scene.canCertify!==false||scene.turns.length!==6||scene.checks.length!==3)
  return null;
 const seen=new Set<string>();
 for(const [index,turn] of scene.turns.entries()){
  if(turn.id!=='turn-'+(index+1)||
     turn.speaker!==(index%2===0?'a':'b')||
     turn.audioId!==[targetLanguage,scene.level.toLowerCase(),
      scene.unitId,turn.id].join('/')||
     !turn.text.trim()||seen.has(turn.audioId))return null;
  seen.add(turn.audioId);
 }
 if(scene.checks.some((check,index)=>check.afterTurnId!=='turn-'+(2*index+2)||
  !scene.turns[2*index+1]?.text.includes(check.verbatimEvidence)))return null;
 return{
  sceneId:scene.sceneId,level:scene.level,unitId:scene.unitId,
  knownLanguage,targetLanguage,checks:scene.checks,
  spokenFollowUp:scene.spokenFollowUp,noMicAlternative:scene.noMicAlternative,
  turns:scene.turns.map((turn,index)=>({
   index,audioId:turn.audioId,
   cue:{
    id:'a2-b2-editorial-only/'+turn.audioId,language:targetLanguage,
    locale:voiceLocales[targetLanguage],text:turn.text,
    kind:'dialogue-model-answer',source:'voicefirst-original'
   },
   reviewerOnly:true,recordedAudioAvailable:false,offlineGuaranteed:false,
   canAssessListening:false,canRecordProgress:false,publicAvailable:false
  })),
  publicAvailable:false,canScore:false,canCertify:false
 };
}
