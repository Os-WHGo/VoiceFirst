/** Suggest screen-based follow-up from actual oral course evidence; never grant written proficiency automatically. */
import {lessonsFor,type CourseProgress} from './course.js';
import type {SkillRecord} from './skill-evidence.js';
export interface WrittenFollowup {lessonId:string;phrase:string;context:string;readingPending:true;writingPending:true}
export interface ScreenReviewTask {lessonId:string;kind:'reading'|'writing';sourcePhrase:string;prompt:string;assessment:'practice-only'}
export function writtenFollowups(progress:CourseProgress,limit=10):WrittenFollowup[]{
 if(!Number.isInteger(limit)||limit<1||limit>30)throw Error('Invalid limit');
 const lessons=lessonsFor(progress.language);
 return lessons.filter(l=>progress.completed.includes(l.id)).slice(-limit).reverse().map(l=>({
  lessonId:l.id,phrase:l.exercises[0]?.utterance??'',context:l.context,readingPending:true,writingPending:true
 }));
}

/** On-demand reading/writing practice reuses known oral content; no exam score is inferred. */
export function screenReviewTasks(progress:CourseProgress,skills:SkillRecord,limit=10):ScreenReviewTask[]{
 if(progress.language!==skills.language)throw Error('Language mismatch');
 return writtenFollowups(progress,limit).flatMap(item=>[
  {lessonId:item.lessonId,kind:'reading' as const,sourcePhrase:item.phrase,prompt:'Read the phrase and explain what it means in this situation.',assessment:'practice-only' as const},
  {lessonId:item.lessonId,kind:'writing' as const,sourcePhrase:item.phrase,prompt:'Write a short response appropriate to this situation.',assessment:'practice-only' as const}
 ]);
}
