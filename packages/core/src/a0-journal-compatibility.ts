/** Detects A0 progress references that are incompatible with a candidate catalog revision. */
import {type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export interface A0CompatibilityIssue {eventId:string;lessonId:string;code:'REMOVED_LESSON'|'CHANGED_ANSWER_OPTIONS'|'INVALID_ATTEMPT_SEQUENCE'}
export function auditA0JournalCompatibility(journal:A0Journal,lessons:readonly A0LessonCandidate[]):A0CompatibilityIssue[]{
 const byId=new Map(lessons.filter(l=>l.targetLanguage===journal.targetLanguage).map(l=>[l.lessonId,l]));
 const count=new Map<string,number>(),issues:A0CompatibilityIssue[]=[];
 for(const event of journal.events){
  const lesson=byId.get(event.lessonId);
  if(!lesson){issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'REMOVED_LESSON'});continue;}
  if(!lesson.options.some(option=>option.id===event.selectedOptionId)){
   issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'CHANGED_ANSWER_OPTIONS'});
  }
  const expected=(count.get(event.lessonId)??0)+1;
  if(event.attemptNumber!==expected)issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'INVALID_ATTEMPT_SEQUENCE'});
  count.set(event.lessonId,expected);
 }
 return issues;
}
