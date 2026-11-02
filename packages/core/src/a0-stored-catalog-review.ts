/** Review a candidate A0 catalog and load the exact persisted snapshot before mounting it.
 * One read prevents racing a preflight read against a different restored journal.
 * Never writes to storage; the caller retains the raw snapshot for CAS.
 */
import {type A0StoragePort} from './a0-session-storage.js';
import {type TargetLanguage} from './types.js';
import {reviewA0CatalogUpdate} from './a0-catalog-update.js';
import {loadA0Journal,newA0Journal,type A0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
const key=(language:TargetLanguage)=>'voicefirst.a0.journal.v1.'+language;
type BlockReason='INVALID_CATALOG'|'INCOMPATIBLE_PROGRESS'|'UNREADABLE_PROGRESS'|'STORAGE_UNAVAILABLE';
export type A0StoredCatalogReview=
 | {kind:'ready_candidate';lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:BlockReason;publishable:false};
export type A0StoredCatalogSession=
 | {kind:'ok';journal:A0Journal;raw:string|null;lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:BlockReason;publishable:false};
/** A protected read with the original bundled catalog as the historical reference. */
export async function restoreA0CatalogSession(
 port:A0StoragePort,input:unknown,language:TargetLanguage,previousLessons:readonly A0LessonCandidate[]
):Promise<A0StoredCatalogSession>{
 const initial=reviewA0CatalogUpdate(input,[]);
 if(initial.kind==='blocked')return {kind:'blocked',reason:'INVALID_CATALOG',publishable:false};
 let raw:string|null;
 try{raw=await port.read(key(language));}
 catch{return {kind:'blocked',reason:'STORAGE_UNAVAILABLE',publishable:false};}
 if(raw===null)return {kind:'ok',journal:newA0Journal(language),raw:null,lessons:initial.lessons,publishable:false};
 // The old journal is validated against its original authored answer meanings,
 // not against a possibly changed option list in the new candidate catalog.
 const previous=loadA0Journal(raw,language,previousLessons);
 if(previous.kind!=='ok')return {kind:'blocked',reason:'UNREADABLE_PROGRESS',publishable:false};
 const decision=reviewA0CatalogUpdate(input,[previous.journal],previousLessons);
 if(decision.kind==='blocked')return {kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',publishable:false};
 return {kind:'ok',journal:previous.journal,raw,lessons:decision.lessons,publishable:false};
}
/** Legacy preflight-only caller; prefer restoreA0CatalogSession for a mobile mount. */
export async function reviewA0StoredCatalog(
 port:A0StoragePort,input:unknown,language:TargetLanguage,previousLessons:readonly A0LessonCandidate[]
):Promise<A0StoredCatalogReview>{
 const result=await restoreA0CatalogSession(port,input,language,previousLessons);
 return result.kind==='blocked'?result:{kind:'ready_candidate',lessons:result.lessons,publishable:false};
}
