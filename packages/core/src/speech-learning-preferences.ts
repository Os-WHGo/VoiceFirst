/** Accent is a learner preference, never a prerequisite or a proficiency gate. */
export type EnglishExposure='international-clear'|'canadian'|'american'|'british'|'mixed';
export type InstructionLanguageMode='support-language'|'progressive'|'target-language';
export interface SpeechLearningPreferences{
 englishExposure:EnglishExposure;
 instructionMode:InstructionLanguageMode;
 /** Student-controlled even at C2; never infer from nationality. */
 allowSupportLanguageOnRequest:boolean;
 playbackRate:number;
}
export const defaultSpeechLearningPreferences:SpeechLearningPreferences={
 englishExposure:'international-clear',instructionMode:'progressive',allowSupportLanguageOnRequest:true,playbackRate:0.88
};
export function validateSpeechLearningPreferences(p:SpeechLearningPreferences):SpeechLearningPreferences{
 const accents:readonly EnglishExposure[]=['international-clear','canadian','american','british','mixed'];
 const modes:readonly InstructionLanguageMode[]=['support-language','progressive','target-language'];
 if(!accents.includes(p.englishExposure)||!modes.includes(p.instructionMode))throw new Error('Invalid speech preferences');
 return {...p,playbackRate:Number.isFinite(p.playbackRate)?Math.max(0.65,Math.min(1.2,p.playbackRate)):0.88};
}
/** CEFR is advisory only; learner can override language of explanations at any level. */
export function preferredInstructionMode(level:'A0'|'A1'|'A2'|'B1'|'B2'|'C1'|'C2',pref:SpeechLearningPreferences):InstructionLanguageMode{
 if(pref.instructionMode!=='progressive')return pref.instructionMode;
 return level==='A0'||level==='A1'?'support-language':level==='A2'||level==='B1'?'progressive':'target-language';
}
