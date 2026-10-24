/** Review a candidate A0 catalog against persisted progress before mounting it. */
import {type A0StoragePort} from './a0-session-storage.js';
import {type TargetLanguage} from './types.js';
import {reviewA0CatalogUpdate,type A0CatalogUpdateDecision} from './a0-catalog-update.js';
import {loadA0Journal} from './a0-attempt-journal.js';
import {type A0LessonCandidate} from './a0-functional-candidate-import.js';
const key=(language:TargetLanguage)=>'voicefirst.a0.journal.v1.'+language;
export type A0StoredCatalogReview=
 | {kind:'ready_candidate';lessons:A0LessonCandidate[];publishable:false}
 | {kind:'blocked';reason:'INVALID_CATALOG'|'INCOMPATIBLE_PROGRESS'|'UNREADABLE_PROGRESS'|'STORAGE_UNAVAILABLE';publishable:false};
export async function reviewA0StoredCatalog(port:A0StoragePort,input:unknown,language:TargetLanguage,previousLessons:readonly A0LessonCandidate[]):Promise<A0StoredCatalogReview>{
 const initial=reviewA0CatalogUpdate(input,[]);
 if(initial.kind==='blocked')return {kind:'blocked',reason:'INVALID_CATALOG',publishable:false};
 let raw:string|null;
 try{raw=await port.read(key(language));}catch{return {kind:'blocked',reason:'STORAGE_UNAVAILABLE',publishable:false};}
 if(raw!==null){
  const previous=loadA0Journal(raw,language,previousLessons);
  if(previous.kind!=='ok')return {kind:'blocked',reason:'UNREADABLE_PROGRESS',publishable:false};
  const decision:A0CatalogUpdateDecision=reviewA0CatalogUpdate(input,[previous.journal]);
  if(decision.kind==='blocked')return {kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',publishable:false};
 }
 return {kind:'ready_candidate',lessons:initial.lessons,publishable:false};
}
