/** Deterministic A0 lesson navigation, independent of device and candidate publisher. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {type A0Journal} from './a0-attempt-journal.js';
import {summarizeA0Attempts} from './a0-choice-evaluation.js';
export interface A0LessonRoute {lessonId:string;sequence:number;available:boolean;completed:boolean;missingPrerequisites:string[]}
export function a0LessonRoutes(lessons:readonly A0LessonCandidate[],journal:A0Journal):A0LessonRoute[]{
 const scoped=lessons.filter(l=>l.targetLanguage===journal.targetLanguage);
 const ids=new Set(scoped.map(l=>l.lessonId));
 const completed=new Set(summarizeA0Attempts(scoped,journal.events).completedLessonIds);
 return [...scoped].sort((a,b)=>a.sequence-b.sequence||a.lessonId.localeCompare(b.lessonId)).map(lesson=>{
  const missingPrerequisites=lesson.prerequisites.filter(id=>!ids.has(id)||!completed.has(id));
  return {lessonId:lesson.lessonId,sequence:lesson.sequence,available:missingPrerequisites.length===0,completed:completed.has(lesson.lessonId),missingPrerequisites};
 });
}
export function nextA0LessonId(lessons:readonly A0LessonCandidate[],journal:A0Journal):string|null {
 return a0LessonRoutes(lessons,journal).find(l=>l.available&&!l.completed)?.lessonId??null;
}
