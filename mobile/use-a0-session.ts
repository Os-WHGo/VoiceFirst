/** Mobile A0 session hook. Candidate content is never auto-published. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {restoreA0Session,restoreA0CatalogSession,commitA0Attempt,a0JournalProgress,type A0Journal,type A0JournalEvent,type A0LessonCandidate,type TargetLanguage} from '@voicefirst/core';
import {a0DeviceStorage} from './a0-device-storage';
/** Supply the immutable previous catalog and the new source when showing bundled A0 content.
 * The legacy two-argument call is kept for existing, isolated hook tests only.
 */
export interface A0CatalogPreflight {input:unknown;previousLessons:readonly A0LessonCandidate[]}
export function useA0Session(target:TargetLanguage,lessons:readonly A0LessonCandidate[],preflight?:A0CatalogPreflight){
 const [journal,setJournal]=useState<A0Journal|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'blocked'>('loading');
 const [error,setError]=useState('');
 const queue=useRef(Promise.resolve());
 const current=useRef<A0Journal|null>(null);
 const raw=useRef<string|null>(null);
 const failed=useRef(false);
 const epoch=useRef(0);
 useEffect(()=>{
  const session=++epoch.current;
  current.current=null;raw.current=null;failed.current=false;setJournal(null);setStatus('loading');setError('');
  // Preserve write ordering across target switches. A previous write must not mutate a new session.
  void queue.current.catch(()=>undefined).then(async()=>{
   if(!preflight)return restoreA0Session(a0DeviceStorage,target,lessons);
   const checked=await restoreA0CatalogSession(a0DeviceStorage,preflight.input,target,preflight.previousLessons);
   if(checked.kind!=='ok')return checked;
   // The UI must show exactly the lessons validated against the historical
   // catalog. Do not allow a stale or independently transformed option list.
   const normalize=(items:readonly A0LessonCandidate[])=>JSON.stringify(
    [...items].sort((a,b)=>a.lessonId.localeCompare(b.lessonId)));
   const fromCatalog=checked.lessons.filter(l=>l.targetLanguage===target);
   if(normalize(fromCatalog)!==normalize(lessons))
    return {kind:'invalid' as const,reason:'A0_CATALOG_PRESENTATION_MISMATCH'};
   return checked;
  }).then(result=>{
   if(epoch.current!==session)return;
   if(result.kind!=='ok'){setError('El historial A0 no puede leerse. No se sobrescribirá.');setStatus('blocked');return;}
   current.current=result.journal;raw.current=result.raw;setJournal(result.journal);setStatus('ready');
  }).catch(()=>{if(epoch.current===session){setError('No se pudo acceder al almacenamiento A0.');setStatus('blocked');}});
  return()=>{epoch.current++;current.current=null;};
 },[target,lessons,preflight]);
 const submit=useCallback((lesson:A0LessonCandidate,event:A0JournalEvent)=>{
  if(status!=='ready'||failed.current||!current.current||lesson.targetLanguage!==target)return Promise.resolve(false);
  const session=epoch.current;
  // Queue each event in order; do not write into a different language after switching.
  let committed=false;
  const operation=queue.current.catch(()=>undefined).then(async()=>{
   if(epoch.current!==session||failed.current||!current.current)return;
   const before=current.current;
   let saved:A0Journal;
   try{saved=await commitA0Attempt(a0DeviceStorage,before,lesson,event,raw.current);}
   catch(error){if(epoch.current===session)failed.current=true;throw error;}
   if(epoch.current!==session)return;
   if(saved!==before)raw.current=JSON.stringify(saved);
   current.current=saved;setJournal(saved);committed=saved.revision===before.revision+1;
  });
  queue.current=operation.then(()=>undefined,()=>undefined);
  return operation.then(()=>committed).catch(()=>{if(epoch.current===session){setStatus('blocked');setError('No se pudo guardar la respuesta. Se detuvo la sesión para proteger el historial.');}return false;});
 },[status,target]);
 return {status,error,journal,progress:journal?a0JournalProgress(journal,lessons):null,submit};
}
