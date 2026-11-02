/** Non-destructive A0 catalog update gate: existing progress must remain interpretable.
 * Historical journals store option IDs only, not the answer key used when recorded.
 */
import {loadA0CandidateCatalog,type A0CatalogIssue} from './a0-catalog-gate.js';
import {auditA0JournalCompatibility,type A0CompatibilityIssue} from './a0-journal-compatibility.js';
import {type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export type A0CatalogUpdateDecision=
 | {kind:'compatible_candidate';lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:'INVALID_CATALOG'|'INCOMPATIBLE_PROGRESS'|'MISSING_BASELINE';catalogIssues:A0CatalogIssue[];progressIssues:A0CompatibilityIssue[];publishable:false};
/** Provide previousLessons whenever any journal has history.
 * Without it, a changed correct answer or option label could silently rewrite
 * what an earlier selection meant. Fail closed instead of guessing.
 */
export function reviewA0CatalogUpdate(input:unknown,journals:readonly A0Journal[],previousLessons?:readonly A0LessonCandidate[]):A0CatalogUpdateDecision {
 const catalog=loadA0CandidateCatalog(input);
 if(catalog.kind==='blocked')return {kind:'blocked',reason:'INVALID_CATALOG',catalogIssues:catalog.issues,progressIssues:[],publishable:false};
 const progressIssues=journals.flatMap(journal=>auditA0JournalCompatibility(journal,catalog.lessons,previousLessons));
 if(progressIssues.length)return {kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',catalogIssues:[],progressIssues,publishable:false};
 if(journals.some(journal=>journal.events.length>0)&&!previousLessons)
  return {kind:'blocked',reason:'MISSING_BASELINE',catalogIssues:[],progressIssues:[],publishable:false};
 return {kind:'compatible_candidate',lessons:catalog.lessons,publishable:false};
}
