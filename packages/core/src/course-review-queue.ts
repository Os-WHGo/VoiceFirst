/** Pure offline review queue for authored course exercises. No user audio or transcript stored. */
import {lessonsFor,type CourseProgress,type OfflineLesson,type CourseExercise} from './course.js';
export interface ReviewQueueEntry {lesson:OfflineLesson;exercise:CourseExercise;dueOn:string;attempts:number;correct:number}
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
function validDay(day:string):boolean {
 if(!dayPattern.test(day))return false;
 const stamp=Date.parse(day+'T12:00:00Z');
 return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===day;
}
/** Only explicitly recorded due dates are eligible; no inferred grades or streak pressure. */
export function courseReviewQueue(progress:CourseProgress,today:string):ReviewQueueEntry[]{
 if(!validDay(today))throw new Error('Invalid review date');
 const result:ReviewQueueEntry[]=[];
 for(const lesson of lessonsFor(progress.language)){
  if(!progress.completed.includes(lesson.id))continue;
  for(const exercise of lesson.exercises){
   const dueOn=progress.due[exercise.id];
   if(!dueOn||!validDay(dueOn)||dueOn>today)continue;
   result.push({lesson,exercise,dueOn,attempts:progress.attempts[exercise.id]??0,correct:progress.correct[exercise.id]??0});
  }
 }
 return result.sort((a,b)=>a.dueOn.localeCompare(b.dueOn)||a.correct-b.correct||a.exercise.id.localeCompare(b.exercise.id));
}
export function courseReviewSummary(progress:CourseProgress,today:string):{due:number;overdue:number;completedLessons:number}{
 const queue=courseReviewQueue(progress,today);
 return {due:queue.length,overdue:queue.filter(item=>item.dueOn<today).length,completedLessons:progress.completed.length};
}

/** Learner-requested review of a completed lesson, even when nothing is due. */
export function voluntaryCourseReview(progress:CourseProgress,lessonId:string):ReviewQueueEntry[]{
 const lesson=lessonsFor(progress.language).find(l=>l.id===lessonId);
 if(!lesson||!progress.completed.includes(lesson.id))return [];
 return lesson.exercises.filter(e=>e.type==='recall'||e.type==='checkpoint').map(exercise=>({lesson,exercise,dueOn:progress.due[exercise.id]??'',attempts:progress.attempts[exercise.id]??0,correct:progress.correct[exercise.id]??0}));
}
