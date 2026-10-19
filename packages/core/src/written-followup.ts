/** Suggest screen-based follow-up from actual oral course evidence; never grant written proficiency automatically. */
import {lessonsFor,type CourseProgress} from './course.js';
export interface WrittenFollowup {lessonId:string;phrase:string;context:string;readingPending:true;writingPending:true}
export function writtenFollowups(progress:CourseProgress,limit=10):WrittenFollowup[]{
 if(!Number.isInteger(limit)||limit<1||limit>30)throw Error('Invalid limit');
 const lessons=lessonsFor(progress.language);
 return lessons.filter(l=>progress.completed.includes(l.id)).slice(-limit).reverse().map(l=>({
  lessonId:l.id,phrase:l.exercises[0]?.utterance??'',context:l.context,readingPending:true,writingPending:true
 }));
}
