/** All adults (including neurodivergent adults) can customize learning without diagnosis.
 * No inference of ADHD/autism, and no age-imposed ceiling on CEFR level.
 */
import type {AgeStage} from './learning-paths.js';
export type CorrectionTiming='after-each-answer'|'after-exercise'|'on-request';
export type InstructionFormat='one-step'|'full-context';
export type SensoryPresentation='calm'|'standard';
export type AnswerControl='wait-for-me'|'auto-after-silence';
export interface ExperiencePreferences {
  ageStage:AgeStage;
  correctionTiming:CorrectionTiming;
  instructionFormat:InstructionFormat;
  sensoryPresentation:SensoryPresentation;
  answerControl:AnswerControl;
  returnToLastStep:boolean;
  subtitles:boolean;
  noStreakPressure:true;
}
export const defaultExperiencePreferences:ExperiencePreferences={
  ageStage:'adult',correctionTiming:'after-exercise',instructionFormat:'one-step',
  sensoryPresentation:'calm',answerControl:'wait-for-me',returnToLastStep:true,
  subtitles:true,noStreakPressure:true,
};
export function validateExperiencePreferences(value:unknown):ExperiencePreferences{
  const base=defaultExperiencePreferences;
  if(!value||typeof value!=='object')return {...base};
  const x=value as Partial<ExperiencePreferences>;
  const choose=<T extends string>(v:unknown,items:readonly T[],fallback:T):T=>
    items.includes(v as T)?v as T:fallback;
  return {
    ageStage:choose(x.ageStage,['preschool','primary','preteen','teen','adult'],base.ageStage),
    correctionTiming:choose(x.correctionTiming,['after-each-answer','after-exercise','on-request'],base.correctionTiming),
    instructionFormat:choose(x.instructionFormat,['one-step','full-context'],base.instructionFormat),
    sensoryPresentation:choose(x.sensoryPresentation,['calm','standard'],base.sensoryPresentation),
    answerControl:choose(x.answerControl,['wait-for-me','auto-after-silence'],base.answerControl),
    returnToLastStep:x.returnToLastStep!==false,
    subtitles:x.subtitles!==false,
    noStreakPressure:true,
  };
}
export function launchEligibility(pref:ExperiencePreferences):'adult-preview'|'child-profile-needs-review'{
  return pref.ageStage==='adult'?'adult-preview':'child-profile-needs-review';
}
export function explainPersonalization(pref:ExperiencePreferences){
  return {
    feedback:pref.correctionTiming,
    questionStyle:pref.instructionFormat,
    sensory:pref.sensoryPresentation,
    resume:pref.returnToLastStep,
    captions:pref.subtitles,
    /** No health/diagnostic data required or stored. */
    asksDiagnosis:false as const,
    cefrCeiling:null,
  };
}
