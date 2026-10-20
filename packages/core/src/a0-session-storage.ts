/** Dependency-injected persistence boundary for A0. No platform APIs in shared core. */
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
import {newA0Journal,loadA0Journal,appendA0JournalEvent,type A0Journal,type A0JournalEvent} from './a0-attempt-journal.js';
import {type TargetLanguage} from './types.js';
export interface A0StoragePort {read(key:string):Promise<string|null>;write(key:string,value:string):Promise<void>}
export type A0SessionLoad={kind:'ok';journal:A0Journal}|{kind:'invalid';reason:string};
const storageKey=(target:TargetLanguage)=>'voicefirst.a0.journal.v1.'+target;
/** Does not silently erase corrupt data: caller must surface recovery or export options. */
export async function restoreA0Session(port:A0StoragePort,target:TargetLanguage,lessons:readonly A0LessonCandidate[]):Promise<A0SessionLoad>{
 const raw=await port.read(storageKey(target));
 if(raw===null)return {kind:'ok',journal:newA0Journal(target)};
 return loadA0Journal(raw,target,lessons);
}
/** Write first, return committed state only after storage confirms success. */
export async function commitA0Attempt(port:A0StoragePort,journal:A0Journal,lesson:A0LessonCandidate,event:A0JournalEvent):Promise<A0Journal>{
 const next=appendA0JournalEvent(journal,lesson,event);
 if(next===journal)return journal;
 await port.write(storageKey(journal.targetLanguage),JSON.stringify(next));
 return next;
}
