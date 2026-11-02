/** Dependency-injected persistence boundary for A0. No platform APIs in shared core. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {newA0Journal,loadA0Journal,appendA0JournalEvent,type A0Journal,type A0JournalEvent} from './a0-attempt-journal.js';
import {type TargetLanguage} from './types.js';
import {canonicalJSON} from './content-validation.js';
export interface A0StoragePort {
 read(key:string):Promise<string|null>;
 /** Legacy/simulated ports only. Device implementations must use compareAndWrite. */
 write(key:string,value:string):Promise<void>;
 compareAndWrite?(key:string,expectedRaw:string|null,value:string):Promise<boolean>;
}
export type A0SessionLoad={kind:'ok';journal:A0Journal;raw:string|null}|{kind:'invalid';reason:string};
const storageKey=(target:TargetLanguage)=>'voicefirst.a0.journal.v1.'+target;
/** Does not silently erase corrupt data: caller must surface recovery or export options. */
export async function restoreA0Session(port:A0StoragePort,target:TargetLanguage,lessons:readonly A0LessonCandidate[]):Promise<A0SessionLoad>{
 const raw=await port.read(storageKey(target));
 if(raw===null)return {kind:'ok',journal:newA0Journal(target),raw:null};
 const result=loadA0Journal(raw,target,lessons);
 return result.kind==='ok'?{...result,raw}:result;
}
/** Write first, return committed state only after storage confirms success. */
export async function commitA0Attempt(port:A0StoragePort,journal:A0Journal,lesson:A0LessonCandidate,event:A0JournalEvent,expectedRaw?:string|null):Promise<A0Journal>{
 const next=appendA0JournalEvent(journal,lesson,event);
 if(next===journal)return journal;
 const raw=JSON.stringify(next);
 if(port.compareAndWrite){
  if(expectedRaw===undefined)throw new Error('A0_SNAPSHOT_REQUIRED');
  if(expectedRaw===null){
   if(journal.revision!==0||journal.events.length!==0)throw new Error('A0_SNAPSHOT_MISMATCH');
  }else{
   if(expectedRaw.length>1000000||canonicalJSON(JSON.parse(expectedRaw))!==canonicalJSON(journal))throw new Error('A0_SNAPSHOT_MISMATCH');
  }
  if(!await port.compareAndWrite(storageKey(journal.targetLanguage),expectedRaw,raw))throw new Error('A0_STORAGE_CONFLICT');
 }else await port.write(storageKey(journal.targetLanguage),raw);
 return next;
}
