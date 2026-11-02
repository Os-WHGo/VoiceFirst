import Storage from 'expo-sqlite/kv-store';
import {type TargetLanguage} from '@voicefirst/core';
export const offlineCourseProgressKey=(language:TargetLanguage)=>`voicefirst.curriculum.v1.${language}`;
export async function readOfflineCourseRaw(language:TargetLanguage){return Storage.getItem(offlineCourseProgressKey(language));}
export async function writeOfflineCourseCAS(language:TargetLanguage,expected:string|null,next:string):Promise<void>{
 await Storage.setItem(offlineCourseProgressKey(language),(current:string|null)=>{
  if(current!==expected)throw new Error('COURSE_PROGRESS_CONFLICT');
  return next;
 });
}
