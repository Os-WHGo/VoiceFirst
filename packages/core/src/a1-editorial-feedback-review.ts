/** Offline, text-only A1 editorial QA. Reuses the deterministic answer evaluator
 * and stable choice ordering. NOT a learner mastery, CEFR, audio or ASR system.
 * This module never saves/freezes typed content, attempts or user identifiers.
 */
import {evaluateAnswer,type AnswerKey} from './answer-evaluation.js';
import {seededOptionOrder} from './choice-activities.js';
import {targetLanguages,type TargetLanguage} from './types.js';
import {firstReleaseLanguages} from './first-release-languages.js';
import {expandedA1GreetingPilots} from './a1-expanded-greeting-pilots.js';
import {expandedA1SituationalPilots} from './a1-situational-pilots.js';

type FirstTarget=(typeof firstReleaseLanguages)[number];
type Scene=(typeof expandedA1GreetingPilots)[number]|(typeof expandedA1SituationalPilots)[number];
const scenes:readonly Scene[]=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
export const a1EditorialSceneTopics:readonly string[]=[
 'greetings-and-introductions','personal-information','numbers-time-and-dates',
 'family-and-people','daily-routines','food-and-shopping',
 'places-and-directions','basic-needs-and-help'
] as const;

/** These are independently authored short-answer variations, not inferred
 * synonyms, translations or a pronunciation grading dictionary.
 * When a valid paraphrase is absent, the editor must review it.
 */
const authoredTypedVariants:Readonly<Record<string,readonly string[]>>={
 'en-CA/A1/greetings-and-introductions#0':['Leo','His name is Leo'],
 'fr-CA/A1/greetings-and-introductions#0':['Léo','Il s’appelle Léo'],
 'es/A1/greetings-and-introductions#0':['Leo','Se llama Leo'],
 'en-CA/A1/personal-information#0':['Vancouver','In Vancouver'],
 'fr-CA/A1/personal-information#0':['Montréal','À Montréal'],
 'es/A1/personal-information#0':['Temuco','En Temuco'],
 'en-CA/A1/numbers-time-and-dates#0':['At two in the afternoon'],
 'fr-CA/A1/numbers-time-and-dates#0':['À deux heures de l’après-midi'],
 'es/A1/numbers-time-and-dates#0':['A las dos de la tarde'],
 'en-CA/A1/food-and-shopping#0':['Two dollars','It costs two dollars'],
 'fr-CA/A1/food-and-shopping#0':['Deux dollars','Elle coûte deux dollars'],
 'es/A1/food-and-shopping#0':['Dos dólares','Cuesta dos dólares']
};
export const a1EditorialReviewVariantKeys:readonly string[]=Object.keys(authoredTypedVariants);

export interface A1EditorialReviewState {
 status:'editorial-only';sceneId:string;targetLanguage:FirstTarget;
 knownLanguage:TargetLanguage;cursor:number;phase:'question'|'feedback';
 revealed:boolean;closed:boolean;lastResult:'supported'|'unverified'|'not-supported'|'skipped'|null;
 recordedProgress:false;canScore:false;publicAvailable:false;
}
export interface A1EditorialReviewQuestion {
 kind:'question';id:string;question:string;index:number;total:3;
 options:readonly {id:'supported'|'unsupported';text:string}[];
 revealedEvidence?:string;feedback?:string;
 hintAvailable:boolean;canRecordProgress:false;audioAvailable:false;
}
export interface A1EditorialReviewComplete {
 kind:'complete';total:3;recordedProgress:false;certification:false;
}
export type A1EditorialReviewStep=A1EditorialReviewQuestion|A1EditorialReviewComplete;
export type A1ReviewSubmission={kind:'choice';optionId:string}|{kind:'typed';text:string}|{kind:'skip'};
export interface A1ReviewSubmissionResult {
 state:A1EditorialReviewState;result:'supported'|'unverified'|'not-supported'|'skipped';
 /** Copy never includes the learner's original text or ASR output. */
 feedback:string;recordedProgress:false;countsAsMastery:false;
}
const getScene=(sceneId:string):Scene|undefined=>scenes.find(s=>s.sceneId===sceneId);
const labels:Readonly<Record<FirstTarget,Readonly<Record<string,string>>>>={
 'en-CA':{
  supported:'This matches the authored evidence. It is editorial practice, not a CEFR score.',
  variant:'That matches an authored alternative. No mastery or pronunciation is assessed.',
  unverified:'That wording has not been independently reviewed. Check the scene and try again, or skip without penalty.',
  unsupported:'The selected statement is not supported by the scene. Check the evidence before continuing.',
  skipped:'Skipped without penalty. The answer remains an editorial example.'
 },
 'fr-CA':{
  supported:'Cette réponse correspond au texte source. Ce n’est pas une évaluation du niveau CECR.',
  variant:'Cette variante a été rédigée et acceptée. Aucun niveau ni prononciation ne sont évalués.',
  unverified:'Cette formulation n’a pas été vérifiée. Consultez le dialogue, réessayez ou passez sans pénalité.',
  unsupported:'Cette affirmation n’est pas appuyée par le dialogue. Vérifiez la citation avant de continuer.',
  skipped:'Question passée sans pénalité. La réponse reste un exemple éditorial.'
 },
 es:{
  supported:'Coincide con la evidencia escrita. Es una práctica editorial, no una nota MCER.',
  variant:'Coincide con una alternativa redactada. No evalúa dominio ni pronunciación.',
  unverified:'Esa formulación no está revisada. Consulta el diálogo, inténtalo otra vez o continúa sin penalización.',
  unsupported:'La afirmación seleccionada no está respaldada por el diálogo. Revisa la evidencia.',
  skipped:'Pregunta omitida sin penalización. La respuesta sigue siendo un ejemplo editorial.'
 }
};
function validated(input:unknown):A1EditorialReviewState|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const s=input as Partial<A1EditorialReviewState>,scene=getScene(String(s.sceneId));
 if(!scene||s.status!=='editorial-only'||s.targetLanguage!==scene.targetLanguage||
   !targetLanguages.includes(s.knownLanguage as TargetLanguage)||
   !Number.isSafeInteger(s.cursor)||s.cursor!<0||s.cursor!>3||
   (s.phase!=='question'&&s.phase!=='feedback')||
   typeof s.revealed!=='boolean'||typeof s.closed!=='boolean'||
   s.recordedProgress!==false||s.canScore!==false||s.publicAvailable!==false||
   ![null,'supported','unverified','not-supported','skipped'].includes(s.lastResult??'INVALID'))
  return null;
 return s as A1EditorialReviewState;
}
/** Returns only unpublished rehearsal state; no learner session is created. */
export function startA1EditorialReview(
 knownLanguage:TargetLanguage,targetLanguage:TargetLanguage,unitId:string
):A1EditorialReviewState|null{
 if(!targetLanguages.includes(knownLanguage)||
   !firstReleaseLanguages.includes(targetLanguage as FirstTarget)||
   knownLanguage===targetLanguage)return null;
 const scene=getScene(targetLanguage+'/A1/'+unitId);
 if(!scene||scene.publicAvailable!==false||scene.audioStatus!=='not-recorded'||
    scene.canScore!==false)return null;
 return {
  status:'editorial-only',sceneId:scene.sceneId,targetLanguage:targetLanguage as FirstTarget,
  knownLanguage,cursor:0,phase:'question',revealed:false,closed:false,
  lastResult:null,recordedProgress:false,canScore:false,publicAvailable:false
 };
}
export function currentA1EditorialReview(
 input:unknown,reviewSeed='editorial-preview'
):A1EditorialReviewStep|null{
 const s=validated(input);
 if(!s)return null;
 if(s.closed||s.cursor===3)return {
  kind:'complete',total:3,recordedProgress:false,certification:false
 };
 const scene=getScene(s.sceneId)!,check=scene.checks[s.cursor]!;
 const options=seededOptionOrder([
  {id:'supported' as const,text:check.verbatimEvidence},
  {id:'unsupported' as const,text:check.unsupportedInterpretation}
 ],reviewSeed+'/'+s.sceneId+'/'+s.cursor);
 return {
  kind:'question',id:s.sceneId+'/evidence-'+(s.cursor+1),index:s.cursor,total:3,
  question:check.question,options,hintAvailable:!s.revealed,
  ...(s.revealed?{revealedEvidence:scene.turns[s.cursor*2+1]!.text}:{}),
  ...(s.phase==='feedback'&&s.lastResult?{
   feedback:labels[s.targetLanguage][s.lastResult==='not-supported'?'unsupported':
    s.lastResult==='supported'?'supported':s.lastResult]
  }:{}),
  canRecordProgress:false,audioAvailable:false
 };
}
export function submitA1EditorialReview(
 input:unknown,submission:A1ReviewSubmission
):A1ReviewSubmissionResult|null{
 const s=validated(input);
 if(!s||s.closed||s.cursor>=3||s.phase!=='question'||
    !submission||typeof submission!=='object')return null;
 const scene=getScene(s.sceneId)!,check=scene.checks[s.cursor]!;
 let result:'supported'|'unverified'|'not-supported'|'skipped'='unverified';
 let kind:'supported'|'variant'|'unverified'|'unsupported'|'skipped'='unverified';
 if(submission.kind==='skip'){result='skipped';kind='skipped';}
 else if(submission.kind==='choice'){
  if(submission.optionId!=='supported'&&submission.optionId!=='unsupported')return null;
  result=submission.optionId==='supported'?'supported':'not-supported';
  kind=result==='supported'?'supported':'unsupported';
 }else if(submission.kind==='typed'){
  if(typeof submission.text!=='string'||submission.text.length>240)return null;
  const text=submission.text.trim();
  if(text){
   const key:AnswerKey={
    language:s.targetLanguage,models:[check.verbatimEvidence],
    variants:authoredTypedVariants[s.sceneId+'#'+s.cursor]??[]
   };
   const evaluation=evaluateAnswer(key,text,{kind:'typed'});
   if(evaluation.outcome==='correct'||evaluation.outcome==='correct-variant'){
    result='supported';kind=evaluation.matchedAnswer===check.verbatimEvidence?'supported':'variant';
   }
  }
 }else return null;
 const next:A1EditorialReviewState={
  ...s,phase:'feedback',lastResult:result,revealed:result==='not-supported'||s.revealed
 };
 return {state:next,result,feedback:labels[s.targetLanguage][kind]!,
  recordedProgress:false,countsAsMastery:false};
}
export type A1ReviewCommand='next'|'restart'|'reveal'|'stop';
export function advanceA1EditorialReview(
 input:unknown,command:A1ReviewCommand
):A1EditorialReviewState|null{
 const s=validated(input);
 if(!s||!['next','restart','reveal','stop'].includes(command))return null;
 if(command==='stop')return {...s,closed:true};
 if(command==='restart')return {...s,cursor:0,closed:false,phase:'question',
  revealed:false,lastResult:null};
 if(s.closed||s.cursor>=3)return s;
 if(command==='reveal')return {...s,revealed:true};
 return {...s,cursor:Math.min(3,s.cursor+1),phase:'question',
  revealed:false,lastResult:null};
}
