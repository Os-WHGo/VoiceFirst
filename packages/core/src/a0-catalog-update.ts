/** Non-destructive A0 catalog update gate: existing progress must remain interpretable. */
import {loadA0CandidateCatalog,type A0CatalogIssue} from './a0-catalog-gate.js';
import {auditA0JournalCompatibility,type A0CompatibilityIssue} from './a0-journal-compatibility.js';
import {type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export type A0CatalogUpdateDecision=
 | {kind:'compatible_candidate';lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:'INVALID_CATALOG'|'INCOMPATIBLE_PROGRESS';catalogIssues:A0CatalogIssue[];progressIssues:A0CompatibilityIssue[];publishable:false};
export function reviewA0CatalogUpdate(input:unknown,journals:readonly A0Journal[]):A0CatalogUpdateDecision {
 const catalog=loadA0CandidateCatalog(input);
 if(catalog.kind==='blocked')return {kind:'blocked',reason:'INVALID_CATALOG',catalogIssues:catalog.issues,progressIssues:[],publishable:false};
 const progressIssues=journals.flatMap(journal=>auditA0JournalCompatibility(journal,catalog.lessons));
 if(progressIssues.length)return {kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',catalogIssues:[],progressIssues,publishable:false};
 return {kind:'compatible_candidate',lessons:catalog.lessons,publishable:false};
}
