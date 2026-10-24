/** Checks prerequisite graph of A0 candidate lessons before activation. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
export interface A0GraphIssue {lessonId:string;code:'DUPLICATE_LESSON'|'MISSING_PREREQUISITE'|'CROSS_LANGUAGE_PREREQUISITE'|'SELF_PREREQUISITE'|'CYCLIC_PREREQUISITE'}
export function auditA0Prerequisites(lessons:readonly A0LessonCandidate[]):A0GraphIssue[]{
 const issues:A0GraphIssue[]=[];
 const byId=new Map<string,A0LessonCandidate>();
 for(const lesson of lessons){
  if(byId.has(lesson.lessonId))issues.push({lessonId:lesson.lessonId,code:'DUPLICATE_LESSON'});
  else byId.set(lesson.lessonId,lesson);
 }
 for(const lesson of lessons)for(const prerequisite of lesson.prerequisites){
  const other=byId.get(prerequisite);
  if(prerequisite===lesson.lessonId)issues.push({lessonId:lesson.lessonId,code:'SELF_PREREQUISITE'});
  else if(!other)issues.push({lessonId:lesson.lessonId,code:'MISSING_PREREQUISITE'});
  else if(other.targetLanguage!==lesson.targetLanguage)issues.push({lessonId:lesson.lessonId,code:'CROSS_LANGUAGE_PREREQUISITE'});
 }
 const state=new Map<string,number>(),cyclic=new Set<string>();
 const visit=(id:string,stack:string[])=>{
  const status=state.get(id)??0;
  if(status===2)return;
  if(status===1){
   const start=stack.indexOf(id);
   for(const node of stack.slice(start))cyclic.add(node);
   return;
  }
  state.set(id,1);
  const lesson=byId.get(id);
  if(lesson)for(const dependency of lesson.prerequisites){
   if(byId.get(dependency)?.targetLanguage===lesson.targetLanguage)visit(dependency,[...stack,id]);
  }
  state.set(id,2);
 };
 for(const id of byId.keys())visit(id,[]);
 for(const lessonId of cyclic)issues.push({lessonId,code:'CYCLIC_PREREQUISITE'});
 return issues;
}
