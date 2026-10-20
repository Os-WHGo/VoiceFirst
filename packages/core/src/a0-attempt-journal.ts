/** Versioned local A0 attempt journal. Stores answer IDs, never audio or transcripts. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {evaluateA0Choice,summarizeA0Attempts,type A0Attempt} from './a0-choice-evaluation.js';
import {type TargetLanguage,targetLanguages} from './types.js';
export interface A0JournalEvent extends A0Attempt {eventId:string}
export interface A0Journal {schemaVersion:1;targetLanguage:TargetLanguage;revision:number;events:A0JournalEvent[]}
export type A0JournalLoad={kind:'ok';journal:A0Journal}|{kind:'invalid';reason:string};
const validId=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&x.length<=128&&/^[A-Za-z0-9._:-]+$/.test(x);
export function newA0Journal(targetLanguage:TargetLanguage):A0Journal {
 if(!targetLanguages.includes(targetLanguage))throw new Error('Invalid target language');
 return {schemaVersion:1,targetLanguage,revision:0,events:[]};
}
export function appendA0JournalEvent(journal:A0Journal,lesson:A0LessonCandidate,event:A0JournalEvent):A0Journal {
 if(lesson.targetLanguage!==journal.targetLanguage||!validId(event.eventId)||journal.events.length>=10000)return journal;
 if(journal.events.some(x=>x.eventId===event.eventId))return journal;
 if(!evaluateA0Choice(lesson,event))return journal;
 // Once a lesson has been answered correctly, its completion is immutable.
 if(journal.events.some(x=>x.lessonId===lesson.lessonId&&x.selectedOptionId===lesson.correctOptionId))return journal;
 const expected=journal.events.filter(x=>x.lessonId===lesson.lessonId).length+1;
 if(event.attemptNumber!==expected)return journal;
 return {...journal,revision:journal.revision+1,events:[...journal.events,{eventId:event.eventId,lessonId:event.lessonId,selectedOptionId:event.selectedOptionId,attemptNumber:event.attemptNumber}]};
}
export function loadA0Journal(raw:string,targetLanguage:TargetLanguage,lessons:readonly A0LessonCandidate[]):A0JournalLoad {
 if(raw.length>1000000)return {kind:'invalid',reason:'Too large'};
 let v:unknown;try{v=JSON.parse(raw)}catch{return {kind:'invalid',reason:'Unreadable JSON'}}
 if(!v||typeof v!=='object'||Array.isArray(v))return {kind:'invalid',reason:'Invalid header'};
 const obj=v as Record<string,unknown>;
 if(obj.schemaVersion!==1||obj.targetLanguage!==targetLanguage||!targetLanguages.includes(targetLanguage)||!Number.isSafeInteger(obj.revision)||(obj.revision as number)<0||!Array.isArray(obj.events)||obj.events.length>10000)return {kind:'invalid',reason:'Invalid header'};
 const journal=newA0Journal(targetLanguage),ids=new Set<string>();
 const byId=new Map(lessons.filter(l=>l.targetLanguage===targetLanguage).map(l=>[l.lessonId,l]));
 for(const e of obj.events){
  if(!e||typeof e!=='object'||Array.isArray(e))return {kind:'invalid',reason:'Invalid event'};
  const event=e as A0JournalEvent;
  const lesson=byId.get(event.lessonId);
  if(!validId(event.eventId)||ids.has(event.eventId)||!lesson||!evaluateA0Choice(lesson,event)||event.attemptNumber!==journal.events.filter(x=>x.lessonId===event.lessonId).length+1)return {kind:'invalid',reason:'Invalid event'};
  ids.add(event.eventId);journal.events.push({eventId:event.eventId,lessonId:event.lessonId,selectedOptionId:event.selectedOptionId,attemptNumber:event.attemptNumber});
 }
 if(obj.revision!==journal.events.length)return {kind:'invalid',reason:'Revision mismatch'};
 journal.revision=obj.revision as number;
 return {kind:'ok',journal};
}
export function a0JournalProgress(journal:A0Journal,lessons:readonly A0LessonCandidate[]){
 return summarizeA0Attempts(lessons.filter(x=>x.targetLanguage===journal.targetLanguage),journal.events);
}
