/** Deterministic local scoring for A0 choice candidates; no speech service or cloud required.
 * Regionally valid alternative answers are neither errors nor scored attempts.
 */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {a0ConceptFunction,servesFunction} from './choice-activities.js';
export interface A0Attempt {lessonId:string;selectedOptionId:string;attemptNumber:number}
export interface A0Outcome {lessonId:string;correct:boolean;points:0|1;mastered:boolean;feedbackCode:'correct'|'review_context'|'also_valid';publishable:false}
export function evaluateA0Choice(lesson:A0LessonCandidate,attempt:A0Attempt):A0Outcome|null {
 if(attempt.lessonId!==lesson.lessonId||!Number.isSafeInteger(attempt.attemptNumber)||attempt.attemptNumber<1)return null;
 const option=lesson.options.find(o=>o.id===attempt.selectedOptionId);
 if(!option)return null;
 const correct=attempt.selectedOptionId===lesson.correctOptionId;
 // Older in-memory lesson fixtures may lack a concept ID; do not crash during recovery.
 const fn=typeof lesson.conceptId==='string'?a0ConceptFunction(lesson.conceptId):undefined;
 const alsoValid=!correct&&fn!==undefined&&servesFunction(lesson.targetLanguage,option.text,fn);
 return {lessonId:lesson.lessonId,correct,points:correct?1:0,mastered:correct&&attempt.attemptNumber===1,
  feedbackCode:correct?'correct':alsoValid?'also_valid':'review_context',publishable:false};
}
export interface A0Progress {completedLessonIds:string[];masteredLessonIds:string[];correctCount:number;attemptCount:number}
/** Pure reducer. Existing legacy journal events with valid regional alternatives
 * remain readable, but do not consume an assessed attempt or first-try mastery.
 */
export function summarizeA0Attempts(lessons:readonly A0LessonCandidate[],attempts:readonly A0Attempt[]):A0Progress {
 const byId=new Map(lessons.map(l=>[l.lessonId,l]));
 const completed=new Set<string>(),mastered=new Set<string>();
 const scorableByLesson=new Map<string,number>();
 let correctCount=0,attemptCount=0;
 for(const attempt of attempts){
  const lesson=byId.get(attempt.lessonId);
  if(!lesson)continue;
  const outcome=evaluateA0Choice(lesson,attempt);
  if(!outcome||outcome.feedbackCode==='also_valid')continue;
  const assessed=(scorableByLesson.get(lesson.lessonId)??0)+1;
  scorableByLesson.set(lesson.lessonId,assessed);
  attemptCount++;
  if(outcome.correct){correctCount++;completed.add(lesson.lessonId);}
  if(outcome.correct&&assessed===1)mastered.add(lesson.lessonId);
 }
 return {completedLessonIds:[...completed],masteredLessonIds:[...mastered],correctCount,attemptCount};
}
