/** Non-destructive A0 catalog update gate: existing progress must remain interpretable.
 * Historical journals store option IDs only, not the answer key used when recorded.
 */
import {loadA0CandidateCatalog,type A0CatalogIssue} from './a0-catalog-gate.js';
import {auditA0JournalCompatibility,type A0CompatibilityIssue} from './a0-journal-compatibility.js';
import {loadA0Journal,type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export type A0CatalogUpdateDecision=
 | {kind:'compatible_candidate';lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:'INVALID_CATALOG'|'INCOMPATIBLE_PROGRESS'|'MISSING_BASELINE'|'INVALID_SAVED_HISTORY';catalogIssues:A0CatalogIssue[];progressIssues:A0CompatibilityIssue[];publishable:false};
/** Provide previousLessons whenever any journal has history.
 * Without it, a changed correct answer or option label could silently rewrite
 * what an earlier selection meant. Fail closed instead of guessing.
 */
export function reviewA0CatalogUpdate(input:unknown,journals:readonly A0Journal[],previousLessons?:readonly A0LessonCandidate[]):A0CatalogUpdateDecision {
 const catalog=loadA0CandidateCatalog(input);
 if(catalog.kind==='blocked')return {kind:'blocked',reason:'INVALID_CATALOG',catalogIssues:catalog.issues,progressIssues:[],publishable:false};
 // Verify the old journal against its *original* answer key before looking
 // at candidate answers. This catches forged revisions, duplicate IDs and
 // events after completion without deleting or rewriting the stored bytes.
 if(journals.some(journal=>!journal||!Array.isArray(journal.events)||!Number.isSafeInteger(journal.revision)||journal.revision!==journal.events.length))
  return {kind:'blocked',reason:'INVALID_SAVED_HISTORY',catalogIssues:[],progressIssues:[],publishable:false};
 if(previousLessons){
  const valid=journals.every(journal=>{
   try{return loadA0Journal(JSON.stringify(journal),journal.targetLanguage,previousLessons).kind==='ok';}
   catch{return false;}
  });
  if(!valid)return {kind:'blocked',reason:'INVALID_SAVED_HISTORY',catalogIssues:[],progressIssues:[],publishable:false};
 }
 const progressIssues=journals.flatMap(journal=>auditA0JournalCompatibility(journal,catalog.lessons,previousLessons));
 if(progressIssues.length)return {kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',catalogIssues:[],progressIssues,publishable:false};
 if(journals.some(journal=>journal.events.length>0)&&!previousLessons)
  return {kind:'blocked',reason:'MISSING_BASELINE',catalogIssues:[],progressIssues:[],publishable:false};
 return {kind:'compatible_candidate',lessons:catalog.lessons,publishable:false};
}
