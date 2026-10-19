/** Validated persistence and resume for the authored micro-course. No raw transcripts or audio. */
import {lessonsFor,newCourseProgress,type CourseProgress,type OfflineLesson} from './course.js';
import {targetLanguages,type TargetLanguage} from './types.js';
export type CourseStateResult={kind:'ok';progress:CourseProgress}|{kind:'invalid';reason:string};
function isDay(s:unknown):s is string{
  if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return false;
  const time=Date.parse(`${s}T12:00:00Z`);
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===s;
}
function dict(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
export function loadCourseState(raw:string,target:TargetLanguage):CourseStateResult{
  if(!targetLanguages.includes(target)||raw.length>150000)return {kind:'invalid',reason:'Storage size or language'};
  let val:unknown;try{val=JSON.parse(raw);}catch{return {kind:'invalid',reason:'Unreadable JSON'};}
  if(!dict(val)||val.language!==target||!Array.isArray(val.completed)||!dict(val.attempts)||!dict(val.correct)||!dict(val.due))
    return {kind:'invalid',reason:'Unexpected course state'};
  const lessons=lessonsFor(target);
  const ids=new Set(lessons.map(x=>x.id));
  const exercises=new Map(lessons.flatMap(x=>x.exercises.map(e=>[e.id,e] as const)));
  if(val.completed.length>lessons.length||new Set(val.completed).size!==val.completed.length||val.completed.some(x=>typeof x!=='string'||!ids.has(x)))
    return {kind:'invalid',reason:'Unknown completed lesson'};
  const attempts:Record<string,number>=Object.create(null) as Record<string,number>,correct:Record<string,number>=Object.create(null) as Record<string,number>,due:Record<string,string>=Object.create(null) as Record<string,string>;
  for(const [id,count] of Object.entries(val.attempts)){
    if(!exercises.has(id)||!Number.isSafeInteger(count)||(count as number)<0||(count as number)>100000)return {kind:'invalid',reason:'Invalid attempt count'};
    attempts[id]=count as number;
  }
  for(const [id,count] of Object.entries(val.correct)){
    if(!exercises.has(id)||!Number.isSafeInteger(count)||(count as number)<0||(count as number)>(attempts[id]??0))return {kind:'invalid',reason:'Invalid success count'};
    correct[id]=count as number;
  }
  for(const [id,date] of Object.entries(val.due)){
    if(!exercises.has(id)||!isDay(date))return {kind:'invalid',reason:'Invalid review date'};
    due[id]=date;
  }
  for(const lessonId of val.completed){
    const lesson=lessons.find(x=>x.id===lessonId)!;
    const recall=lesson.exercises.find(x=>x.type==='recall');
    const checkpoint=lesson.exercises.find(x=>x.type==='checkpoint');
    if(!recall||!checkpoint||!((correct[recall.id]??0)>0)||!((correct[checkpoint.id]??0)>0))return {kind:'invalid',reason:'Completed lesson lacks evidence'};
  }
  return {kind:'ok',progress:{language:target,completed:[...val.completed],attempts,correct,due}};
}
export function courseStateToJSON(state:CourseProgress):string{
  if(!targetLanguages.includes(state.language))throw new Error('Invalid course language');
  return JSON.stringify(state);
}
/** Prioritize actually due review lessons, but only after their prerequisites. */
export function chooseCourseLesson(state:CourseProgress,day:string):OfflineLesson|null{
  if(!isDay(day))throw new Error('Invalid local date');
  const items=lessonsFor(state.language);
  const due=items.find(l=>state.completed.includes(l.id)&&l.exercises.some(e=>isDay(state.due[e.id])&&state.due[e.id]<=day));
  return due??items.find(l=>!state.completed.includes(l.id)&&(!l.prerequisite||state.completed.includes(l.prerequisite)))??null;
}
/** Explicit review: do not erase evidence of earlier learning. Review-only sessions can increment evidence. */
export function courseLessonStatus(state:CourseProgress,lesson:OfflineLesson):'locked'|'new'|'review'|'completed'{
  if(state.language!==lesson.language)throw new Error('Language mismatch');
  if(lesson.prerequisite&&!state.completed.includes(lesson.prerequisite))return 'locked';
  if(!state.completed.includes(lesson.id))return 'new';
  return 'completed';
}
export function initialCourseState(lang:TargetLanguage){return newCourseProgress(lang);}
