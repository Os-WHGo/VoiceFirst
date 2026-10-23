/** Choice activities: listening comprehension for the course and written recognition for A0 candidates.
 * Option order is shuffled per learner session with a deterministic seed, so the position of the right answer
 * cannot be learned and stays stable across pause and resume. Options that are also valid in some register or
 * region are reviewed, never marked wrong. Original code; content comes from existing authored data only.
 */
import type {A0LessonCandidate} from './a0-functional-candidate-import.js';
import {lessonsFor,type LocalizedText} from './course.js';
import type {SessionActivity} from './learning-session.js';
import {targetLanguages,type TargetLanguage} from './types.js';

/** `greeting` is any time of day; time-specific greetings are separate so morning and evening forms are not mixed. */
export type CommunicativeFunction='greeting'|'greeting-morning'|'greeting-evening'|'farewell'|'thanks'|'request'|'agree'|'disagree';
export interface ChoiceOption {id:string;text:string|LocalizedText}

function fnv1a(text:string):number{
 let h=0x811c9dc5;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
 return h>>>0;
}
/** Deterministic Fisher-Yates shuffle seeded by e.g. session id + activity id. */
export function seededOptionOrder<T>(items:readonly T[],seed:string):T[]{
 let state=fnv1a(seed)||1;
 const next=()=>{state=(state+0x6d2b79f5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[out[i],out[j]]=[out[j]!,out[i]!];}
 return out;
}
const fold=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase().replace(/[’']/g,"'").replace(/[^\p{L}\p{N}' ]/gu,'').trim();
/** Expressions with more than one everyday function. Authored, deliberately small and conservative; unreviewed. */
const multiFunction:Readonly<Record<TargetLanguage,Readonly<Record<string,readonly CommunicativeFunction[]>>>>={
 'en-CA':{hello:['greeting'],hi:['greeting'],'good morning':['greeting-morning'],'good evening':['greeting-evening'],goodbye:['farewell'],bye:['farewell'],'good night':['farewell']},
 // Québec also says "Bonjour" when leaving a shop; "Salut" and "Bonsoir" work both ways.
 'fr-CA':{salut:['greeting','farewell'],bonjour:['greeting-morning','farewell'],bonsoir:['greeting-evening','farewell'],'au revoir':['farewell']},
 es:{hola:['greeting'],'buenos dias':['greeting-morning'],'buenas noches':['greeting-evening','farewell'],adios:['farewell']},
 'pt-BR':{ola:['greeting'],oi:['greeting'],'bom dia':['greeting-morning'],'boa noite':['greeting-evening','farewell'],tchau:['farewell']},
 de:{hallo:['greeting'],'guten morgen':['greeting-morning'],'guten abend':['greeting-evening'],'auf wiedersehen':['farewell'],tschuss:['farewell']},
 it:{ciao:['greeting','farewell'],buongiorno:['greeting-morning','farewell'],buonasera:['greeting-evening','farewell'],arrivederci:['farewell']},
};
export function expressionFunctions(language:TargetLanguage,text:string):readonly CommunicativeFunction[]{
 return multiFunction[language]?.[fold(text)]??[];
}
/** Whether an expression can serve the function an item asks for (an any-time greeting serves a timed one). */
export function servesFunction(language:TargetLanguage,text:string,fn:CommunicativeFunction):boolean{
 const own=expressionFunctions(language,text);
 return own.includes(fn)||(fn.startsWith('greeting-')&&own.includes('greeting'));
}
const a0Functions:Readonly<Record<string,CommunicativeFunction>>={morning:'greeting-morning',evening:'greeting-evening',farewell:'farewell',gratitude:'thanks',affirmative:'agree',polite_request:'request'};
export function a0ConceptFunction(conceptId:string):CommunicativeFunction|undefined{
 return a0Functions[conceptId.split('.').pop()??''];
}
const L=(en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
/** Draft, unreviewed. */
export const alsoValidNote:LocalizedText=L('That option can also be right in some situations or regions. It is not counted as an error; the answer expected here is another one.',
 'Cette option peut aussi convenir selon la situation ou la région. Ce n’est pas compté comme une erreur; la réponse attendue ici est une autre.',
 'Esa opción también puede servir según la situación o la región. No cuenta como error; aquí se esperaba otra respuesta.',
 'Essa opção também pode servir conforme a situação ou a região. Não conta como erro; aqui se esperava outra resposta.',
 'Diese Option kann je nach Situation oder Region auch passen. Sie zählt nicht als Fehler; erwartet wird hier eine andere Antwort.',
 'Questa opzione può andare bene anche a seconda della situazione o della regione. Non conta come errore; qui era attesa un’altra risposta.');

export interface ChoiceAuditItem {id:string;language:TargetLanguage;function?:CommunicativeFunction;options:readonly {id:string;text:string}[];correctOptionId:string}
export interface ChoiceAuditIssue {code:'ANSWER_POSITION_PATTERN'|'AMBIGUOUS_DISTRACTOR'|'DUPLICATE_OPTION'|'CORRECT_MISSING';language:TargetLanguage;itemId?:string;detail:string}
/** Checks a sequence of choice items in presentation order. */
export function auditChoiceItems(items:readonly ChoiceAuditItem[]):ChoiceAuditIssue[]{
 const issues:ChoiceAuditIssue[]=[];
 for(const item of items){
  const index=item.options.findIndex(o=>o.id===item.correctOptionId);
  if(index<0)issues.push({code:'CORRECT_MISSING',language:item.language,itemId:item.id,detail:item.correctOptionId});
  const texts=item.options.map(o=>fold(o.text));
  if(new Set(texts).size!==texts.length)issues.push({code:'DUPLICATE_OPTION',language:item.language,itemId:item.id,detail:'two options read the same'});
  if(item.function)for(const o of item.options)if(o.id!==item.correctOptionId&&servesFunction(item.language,o.text,item.function))
   issues.push({code:'AMBIGUOUS_DISTRACTOR',language:item.language,itemId:item.id,detail:`"${o.text}" can also express ${item.function}`});
 }
 for(const language of targetLanguages){
  const positions=items.filter(i=>i.language===language).map(i=>i.options.findIndex(o=>o.id===i.correctOptionId));
  if(positions.length<4||positions.includes(-1))continue;
  const periodic=[1,2,3,4].some(p=>positions.length>=2*p&&positions.every((x,k)=>k<p||x===positions[k-p]));
  if(periodic)issues.push({code:'ANSWER_POSITION_PATTERN',language,detail:`correct positions follow a repeating pattern: ${positions.map(x=>x+1).join(',')}`});
 }
 return issues;
}
export function a0AuditItems(lessons:readonly A0LessonCandidate[]):ChoiceAuditItem[]{
 return [...lessons].sort((a,b)=>a.targetLanguage.localeCompare(b.targetLanguage)||a.sequence-b.sequence).map(l=>{
  const fn=a0ConceptFunction(l.conceptId);
  return {id:l.lessonId,language:l.targetLanguage,...(fn?{function:fn}:{}),options:l.options,correctOptionId:l.correctOptionId};
 });
}
/** A0 candidate recognition items as session activities (written recognition: reading comprehension).
 * Context and prompt come from the candidate in each known language; the target language has none of its own,
 * so the target language is never used as a known language here. */
export function a0ChoiceActivities(lessons:readonly A0LessonCandidate[]):SessionActivity[]{
 const byConcept=new Map(lessons.map(l=>[`${l.targetLanguage}:${l.conceptId}`,l.lessonId]));
 return [...lessons].sort((a,b)=>a.sequence-b.sequence).map(l=>{
  const fn=a0ConceptFunction(l.conceptId);
  const localized=(m:Record<string,string>):LocalizedText=>Object.fromEntries(targetLanguages.map(k=>[k,m[k]??''])) as unknown as LocalizedText;
  const prerequisite=l.prerequisites[0]?(byConcept.get(`${l.targetLanguage}:${l.prerequisites[0]}`)??l.prerequisites[0]):undefined;
  const correct=l.options.find(o=>o.id===l.correctOptionId)!;
  const acceptable=fn?l.options.filter(o=>o.id!==l.correctOptionId&&servesFunction(l.targetLanguage,o.text,fn)).map(o=>({optionId:o.id,note:alsoValidNote})):[];
  return {id:`${l.lessonId}.choice`,objectiveId:l.lessonId,lessonId:l.lessonId,...(prerequisite?{prerequisite}:{}),band:'A0' as const,kind:'choice' as const,
   goal:localized(l.contextByKnownLanguage),meaning:localized(l.promptByKnownLanguage),context:localized(l.contextByKnownLanguage),instruction:localized(l.promptByKnownLanguage),
   model:correct.text,key:null,options:l.options.map(o=>({id:o.id,text:o.text})),correctOptionId:l.correctOptionId,...(acceptable.length?{acceptableOptions:acceptable}:{}),
   skill:'reading-comprehension' as const,optionLanguage:'target' as const};
 });
}
/** Listening comprehension for the course: hear the phrase, choose what the person is doing, in the known language.
 * Distractors are the meanings of two other authored lessons of the same language. */
export function courseComprehensionActivities(target:TargetLanguage):SessionActivity[]{
 const lessons=lessonsFor(target);
 return lessons.map((lesson,i)=>{
  const listen=lesson.exercises.find(e=>e.type==='listen')??lesson.exercises[0]!;
  const others=[lessons[(i+1)%lessons.length]!,lessons[(i+Math.ceil(lessons.length/2))%lessons.length]!].filter(o=>o.id!==lesson.id);
  const meaningOf=(l:typeof lesson)=>(l.exercises.find(e=>e.type==='listen')??l.exercises[0]!).meaning;
  return {id:`${lesson.id}-comprehension`,objectiveId:lesson.id,lessonId:lesson.id,...(lesson.prerequisite?{prerequisite:lesson.prerequisite}:{}),band:lesson.band,kind:'choice' as const,
   goal:lesson.goal,meaning:listen.meaning,cue:listen.utterance,model:listen.utterance,key:null,
   options:[{id:lesson.id,text:meaningOf(lesson)},...[...new Map(others.map(o=>[o.id,o])).values()].map(o=>({id:o.id,text:meaningOf(o)}))],
   correctOptionId:lesson.id,skill:'listening-comprehension' as const,optionLanguage:'known' as const};
 });
}
