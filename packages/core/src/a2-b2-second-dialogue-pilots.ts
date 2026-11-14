/** A second set of source-grounded six-turn A2/B1/B2 situations for three
 * first-release languages. Structured EDITORIAL DRAFTS only: no recordings,
 * reviewed audio, public course enrolment, learner scoring or certificates.
 *
 * The original first two authored turns are imported verbatim, not replaced.
 * All additional evidence checks must quote the response they refer to.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {a2EditorialDrafts} from './a2-editorial-contract.js';
import {b1EditorialDrafts} from './b1-editorial-contract.js';
import {b2EditorialDrafts} from './b2-editorial-contract.js';
import {expandedFirstReleasePilots,type ExpandedPilotSeed,
 type ExpandedPilotScene,type PilotLevel} from './a2-b2-expanded-pilots.js';
import {secondPilotEnglish} from './a2-b2-second-pilot-en.js';
import {secondPilotFrench} from './a2-b2-second-pilot-fr.js';
import {secondPilotSpanish} from './a2-b2-second-pilot-es.js';

type FirstTarget=(typeof firstReleaseLanguages)[number];
const levels=['A2','B1','B2'] as const;
const seeds:Readonly<Record<FirstTarget,Readonly<Record<PilotLevel,ExpandedPilotSeed>>>>={
 'en-CA':secondPilotEnglish,'fr-CA':secondPilotFrench,es:secondPilotSpanish
};
const originalDrafts=[...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts];
const originalsById=new Map(originalDrafts.map(d=>[[d.targetLanguage,d.level,d.unitId].join('/'),d]));
const firstSceneIds=new Set(expandedFirstReleasePilots.map(s=>s.sceneId));
const sceneId=(language:FirstTarget,level:PilotLevel,unitId:string)=>
 [language,level,unitId].join('/');

/** Exactly nine newly expanded units, with the historical nine untouched.
 * Each turn is source-locked to its own language/level/unit and speaker.
 */
export const expandedSecondEditorialPilots:readonly ExpandedPilotScene[]=firstReleaseLanguages.flatMap(
 targetLanguage=>levels.map(level=>{
  const seed=seeds[targetLanguage][level];
  const id=sceneId(targetLanguage,level,seed.unitId);
  const original=originalsById.get(id);
  if(!original||firstSceneIds.has(id))
   throw new Error('Second A2–B2 pilot must extend an unused, authored source '+id);
  const turns=[...original.dialogue,...seed.continuation].map((text,index)=>({
   id:'turn-'+(index+1),speaker:index%2===0?'a' as const:'b' as const,
   text,audioId:[targetLanguage,level.toLowerCase(),seed.unitId,'turn-'+(index+1)].join('/')
  }));
  return {
   sceneId:id,level,unitId:seed.unitId,targetLanguage,
   turns,checks:seed.checks.map(([question,verbatimEvidence,unsupportedInterpretation],index)=>({
    afterTurnId:'turn-'+(2*index+2),question,verbatimEvidence,unsupportedInterpretation
   })),
   spokenFollowUp:seed.spokenFollowUp,noMicAlternative:seed.noMicAlternative,
   editorialStatus:'not-human-reviewed' as const,audioStatus:'not-recorded' as const,
   rightsStatus:'pending-editorial-clearance' as const,publicAvailable:false as const,
   canScore:false as const,canCertify:false as const
  };
 })
);
export const expandedSecondExpectedAudioIds:readonly string[]=
 expandedSecondEditorialPilots.flatMap(scene=>scene.turns.map(turn=>turn.audioId));

/** A conservative audit of source identity, exact text evidence and all
 * nine editorial boundaries. Not a language or pedagogical approval.
 */
export function auditExpandedSecondEditorialPilots(input:unknown=expandedSecondEditorialPilots){
 const errors:string[]=[],sceneIds=new Set<string>(),audioIds=new Set<string>();
 if(!Array.isArray(input)||input.length!==9){
  return {valid:false,errors:['SECOND_PILOT_COUNT'],scenes:0,turns:0,checks:0,
   availableToLearners:false as const,verifiedAudio:0};
 }
 let turns=0,checks=0;
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){
   errors.push('INVALID_SECOND_PILOT');continue;
  }
  const scene=raw as Partial<ExpandedPilotScene>;
  const id=String(scene.sceneId);
  const known=firstReleaseLanguages.some(lang=>levels.some(level=>
   id===sceneId(lang,level,seeds[lang][level].unitId)));
  if(!known||sceneIds.has(id)||firstSceneIds.has(id)||
   id!==[scene.targetLanguage,scene.level,scene.unitId].join('/'))
   errors.push('UNKNOWN_OR_DUPLICATE_SECOND_PILOT '+id);
  sceneIds.add(id);
  if(scene.editorialStatus!=='not-human-reviewed'||scene.audioStatus!=='not-recorded'||
   scene.rightsStatus!=='pending-editorial-clearance'||scene.publicAvailable!==false||
   scene.canScore!==false||scene.canCertify!==false)
   errors.push('PREMATURE_SECOND_PILOT_RELEASE '+id);
  const original=originalsById.get(id);
  const t=Array.isArray(scene.turns)?scene.turns:[];
  const q=Array.isArray(scene.checks)?scene.checks:[];
  turns+=t.length;checks+=q.length;
  if(t.length!==6||q.length!==3||!original||
   t[0]?.text!==original.dialogue[0]||t[1]?.text!==original.dialogue[1])
   errors.push('CHANGED_OR_INCOMPLETE_ORIGINAL '+id);
  t.forEach((turn,i)=>{
   const expectedId=[scene.targetLanguage,String(scene.level).toLowerCase(),
    scene.unitId,'turn-'+(i+1)].join('/');
   if(!turn||turn.id!=='turn-'+(i+1)||turn.speaker!==(i%2===0?'a':'b')||
    typeof turn.text!=='string'||turn.text.trim().length<24||
    turn.audioId!==expectedId||audioIds.has(String(turn.audioId)))
    errors.push('INVALID_SECOND_TURN '+id+'/'+i);
   if(turn?.audioId)audioIds.add(turn.audioId);
  });
  q.forEach((question,i)=>{
   const referenced=t[2*i+1];
   if(!question||question.afterTurnId!=='turn-'+(2*i+2)||
    typeof question.question!=='string'||question.question.trim().length<14||
    typeof question.verbatimEvidence!=='string'||question.verbatimEvidence.trim().length<7||
    typeof referenced?.text!=='string'||!referenced.text.includes(question.verbatimEvidence)||
    typeof question.unsupportedInterpretation!=='string'||
    question.unsupportedInterpretation.trim().length<24)
    errors.push('UNSUPPORTED_SECOND_EVIDENCE '+id+'/'+i);
  });
  if(typeof scene.spokenFollowUp!=='string'||scene.spokenFollowUp.trim().length<55||
   typeof scene.noMicAlternative!=='string'||scene.noMicAlternative.trim().length<55)
   errors.push('SECOND_MISSING_SPOKEN_OR_WRITTEN_FOLLOWUP '+id);
 }
 return {valid:errors.length===0,errors,scenes:input.length,
  turns,checks,availableToLearners:false as const,verifiedAudio:0};
}
