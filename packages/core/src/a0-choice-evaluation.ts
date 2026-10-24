/** Deterministic local scoring for A0 choice candidates; no speech service or cloud required. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export interface A0Attempt {lessonId:string;selectedOptionId:string;attemptNumber:number}
export interface A0Outcome {lessonId:string;correct:boolean;points:0|1;mastered:boolean;feedbackCode:'correct'|'review_context';publishable:false}
export function evaluateA0Choice(lesson:A0LessonCandidate,attempt:A0Attempt):A0Outcome|null {
 if(attempt.lessonId!==lesson.lessonId||!Number.isSafeInteger(attempt.attemptNumber)||attempt.attemptNumber<1||!lesson.options.some(o=>o.id===attempt.selectedOptionId))return null;
 const correct=attempt.selectedOptionId===lesson.correctOptionId;
 return {lessonId:lesson.lessonId,correct,points:correct?1:0,mastered:correct&&attempt.attemptNumber===1,feedbackCode:correct?'correct':'review_context',publishable:false};
}
export interface A0Progress {completedLessonIds:string[];masteredLessonIds:string[];correctCount:number;attemptCount:number}
/** Pure reducer. Caller owns persistence and should avoid double-counting retried events. */
export function summarizeA0Attempts(lessons:readonly A0LessonCandidate[],attempts:readonly A0Attempt[]):A0Progress {
 const byId=new Map(lessons.map(l=>[l.lessonId,l]));
 const completed=new Set<string>(),mastered=new Set<string>();
 let correctCount=0,attemptCount=0;
 for(const attempt of attempts){
  const lesson=byId.get(attempt.lessonId);
  if(!lesson)continue;
  const outcome=evaluateA0Choice(lesson,attempt);
  if(!outcome)continue;
  attemptCount++;
  if(outcome.correct){correctCount++;completed.add(lesson.lessonId);}
  if(outcome.mastered)mastered.add(lesson.lessonId);
 }
 return {completedLessonIds:[...completed],masteredLessonIds:[...mastered],correctCount,attemptCount};
}
