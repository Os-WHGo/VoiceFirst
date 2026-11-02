/** Detects A0 progress references that are incompatible with a candidate catalog revision.
 * Historical option IDs do not preserve the former answer text or correct answer.
 * A replacement must therefore be checked against its previous authored catalog.
 */
import {type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export interface A0CompatibilityIssue {eventId:string;lessonId:string;code:
 'REMOVED_LESSON'|'CHANGED_ANSWER_OPTIONS'|'CHANGED_CORRECT_OPTION'|'MISSING_PREVIOUS_LESSON'|'CHANGED_LESSON_CONCEPT'|'INVALID_ATTEMPT_SEQUENCE'}
function sameOptions(a:A0LessonCandidate,b:A0LessonCandidate):boolean {
 if(a.options.length!==b.options.length)return false;
 const old=new Map(a.options.map(option=>[option.id,option.text]));
 return b.options.every(option=>old.get(option.id)===option.text);
}
export function auditA0JournalCompatibility(journal:A0Journal,lessons:readonly A0LessonCandidate[],previousLessons?:readonly A0LessonCandidate[]):A0CompatibilityIssue[]{
 const byId=new Map(lessons.filter(l=>l.targetLanguage===journal.targetLanguage).map(l=>[l.lessonId,l]));
 const previous=previousLessons===undefined?null:new Map(previousLessons.filter(l=>l.targetLanguage===journal.targetLanguage).map(l=>[l.lessonId,l]));
 const count=new Map<string,number>(),issues:A0CompatibilityIssue[]=[];
 const checked=new Set<string>();
 for(const event of journal.events){
  const lesson=byId.get(event.lessonId);
  if(!lesson){issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'REMOVED_LESSON'});continue;}
  if(!lesson.options.some(option=>option.id===event.selectedOptionId)){
   issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'CHANGED_ANSWER_OPTIONS'});
  }
  if(previous&&!checked.has(event.lessonId)){
   checked.add(event.lessonId);
   const prior=previous.get(event.lessonId);
   if(!prior)issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'MISSING_PREVIOUS_LESSON'});
   else {
    if(prior.conceptId!==lesson.conceptId||prior.skill!==lesson.skill)
     issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'CHANGED_LESSON_CONCEPT'});
    if(prior.correctOptionId!==lesson.correctOptionId)issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'CHANGED_CORRECT_OPTION'});
    if(!sameOptions(prior,lesson))issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'CHANGED_ANSWER_OPTIONS'});
   }
  }
  const expected=(count.get(event.lessonId)??0)+1;
  if(event.attemptNumber!==expected)issues.push({eventId:event.eventId,lessonId:event.lessonId,code:'INVALID_ATTEMPT_SEQUENCE'});
  count.set(event.lessonId,expected);
 }
 return issues;
}
