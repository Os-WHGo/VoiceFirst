import Storage from 'expo-sqlite/kv-store';
import {loadCourseState,type TargetLanguage} from '@voicefirst/core';
export const offlineCourseProgressKey=(language:TargetLanguage)=>`voicefirst.curriculum.v1.${language}`;
export async function readOfflineCourseRaw(language:TargetLanguage){return Storage.getItem(offlineCourseProgressKey(language));}
/** An unchanged SQLite snapshot is required before replacing course evidence. */
export async function writeOfflineCourseCAS(language:TargetLanguage,expected:string|null,next:string):Promise<void>{
 if(loadCourseState(next,language).kind!=='ok')throw new Error('COURSE_PROGRESS_INVALID');
 if(expected!==null&&loadCourseState(expected,language).kind!=='ok')throw new Error('COURSE_BASELINE_INVALID');
 await Storage.setItem(offlineCourseProgressKey(language),(current:string|null)=>{
  if(current!==expected)throw new Error('COURSE_PROGRESS_CONFLICT');
  return next;
 });
}
