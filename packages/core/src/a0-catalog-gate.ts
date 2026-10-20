/** Imports candidate A0 material only if the complete package passes structural and graph checks. */
import {importA0FunctionalCandidates,type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {auditA0Prerequisites,type A0GraphIssue} from './a0-prerequisite-audit.js';
export interface A0CatalogIssue {path:string;code:string}
export type A0CatalogLoad =
 | {kind:'candidate';lessons:A0LessonCandidate[];issues:[];publishable:false}
 | {kind:'blocked';lessons:[];issues:A0CatalogIssue[];publishable:false};
export function loadA0CandidateCatalog(input:unknown):A0CatalogLoad {
 const parsed=importA0FunctionalCandidates(input);
 const graphIssues:A0GraphIssue[]=auditA0Prerequisites(parsed.lessons);
 const issues:A0CatalogIssue[]=[
  ...parsed.issues,
  ...graphIssues.map(issue=>({path:'lesson:'+issue.lessonId,code:issue.code}))
 ];
 if(issues.length||parsed.lessons.length===0){
  if(!issues.length)issues.push({path:'$',code:'EMPTY_CATALOG'});
  return {kind:'blocked',lessons:[],issues,publishable:false};
 }
 return {kind:'candidate',lessons:parsed.lessons,issues:[],publishable:false};
}
