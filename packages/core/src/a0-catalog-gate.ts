/** Imports candidate A0 material only if the complete package passes structural and graph checks. */
import {importA0FunctionalCandidates,type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {auditA0Prerequisites,type A0GraphIssue} from './a0-prerequisite-audit.js';
export interface A0CatalogIssue {path:string;code:string}
export type A0CatalogLoad =
 | {kind:'candidate';lessons:A0LessonCandidate[];issues:[];publishable:false}
 | {kind:'blocked';lessons:[];issues:A0CatalogIssue[];publishable:false};
export function loadA0CandidateCatalog(input:unknown):A0CatalogLoad {
 const parsed=importA0FunctionalCandidates(input);
 // Authoring files may reference a concept rather than a lesson ID. Resolve only
 // when exactly one lesson in the same target language owns that concept.
 const resolved=parsed.lessons.map(lesson=>({...lesson,prerequisites:lesson.prerequisites.map(ref=>{
  if(parsed.lessons.some(candidate=>candidate.lessonId===ref))return ref;
  const matches=parsed.lessons.filter(candidate=>candidate.targetLanguage===lesson.targetLanguage&&candidate.conceptId===ref);
  return matches.length===1?matches[0].lessonId:ref;
 })}));
 const graphIssues:A0GraphIssue[]=auditA0Prerequisites(resolved);
 const issues:A0CatalogIssue[]=[
  ...parsed.issues,
  ...graphIssues.map(issue=>({path:'lesson:'+issue.lessonId,code:issue.code}))
 ];
 if(issues.length||resolved.length===0){
  if(!issues.length)issues.push({path:'$',code:'EMPTY_CATALOG'});
  return {kind:'blocked',lessons:[],issues,publishable:false};
 }
 return {kind:'candidate',lessons:resolved,issues:[],publishable:false};
}
