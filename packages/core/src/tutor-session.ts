/** Pure session step for authored offline dialogues. No microphone, API or transcript storage. */
import type {TargetLanguage} from './types.js';
import type {GuidedDialogue,DialogueAttempt} from './guided-dialogues.js';
import {dialogueAudioCue} from './guided-dialogues.js';
import type {LocalLearningProgress} from './learning-progress.js';
import {getSavedDialogueRun,saveDialogueAttempt} from './learning-progress.js';
import {decideTutorFeedback,tutorFeedbackForLanguage,type TutorTeachingAction} from './tutor-feedback.js';

export type TutorSessionStep=
 |{status:'complete'}
 |{status:'prompt';speech:string;language:TargetLanguage;turnId:string}
 |{status:'feedback';action:TutorTeachingAction;speech:string;language:TargetLanguage;example?:string;exampleLanguage?:TargetLanguage;progress:LocalLearningProgress};
export function nextTutorPrompt(progress:LocalLearningProgress,dialogue:GuidedDialogue,knownLanguage:TargetLanguage,explainFirst=false):TutorSessionStep{
 const run=getSavedDialogueRun(progress,dialogue);
 if(run.completed)return {status:'complete'};
 const cue=dialogueAudioCue(dialogue,run.turnIndex,knownLanguage,explainFirst);
 const turn=dialogue.turns[run.turnIndex];
 if(!cue||!turn)return {status:'complete'};
 return {status:'prompt',speech:cue.text,language:cue.language,turnId:turn.id};
}
export function applyTutorAttempt(progress:LocalLearningProgress,dialogue:GuidedDialogue,knownLanguage:TargetLanguage,attempt:DialogueAttempt,today:string):TutorSessionStep{
 const run=getSavedDialogueRun(progress,dialogue);
 const turn=dialogue.turns[run.turnIndex];
 if(!turn||run.completed)return {status:'complete'};
 const retries=Math.max(0,(run.attempts[turn.id]||0));
 const decision=decideTutorFeedback(turn,attempt,retries);
 const updated=saveDialogueAttempt(progress,dialogue,attempt,today);
 return {status:'feedback',action:decision.action,speech:tutorFeedbackForLanguage(decision,knownLanguage),
  language:knownLanguage,example:decision.example,exampleLanguage:decision.example?dialogue.target:undefined,progress:updated};
}
