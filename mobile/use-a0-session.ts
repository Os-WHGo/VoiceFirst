/** Mobile A0 session hook. Candidate content is never auto-published. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {restoreA0Session,commitA0Attempt,a0JournalProgress,type A0Journal,type A0JournalEvent,type A0LessonCandidate,type TargetLanguage} from '@voicefirst/core';
import {a0DeviceStorage} from './a0-device-storage';
export function useA0Session(target:TargetLanguage,lessons:readonly A0LessonCandidate[]){
 const [journal,setJournal]=useState<A0Journal|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'blocked'>('loading');
 const [error,setError]=useState('');
 const queue=useRef(Promise.resolve());
 const current=useRef<A0Journal|null>(null);
 const epoch=useRef(0);
 useEffect(()=>{
  const session=++epoch.current;
  current.current=null;setJournal(null);setStatus('loading');setError('');
  // Preserve write ordering across target switches. A previous write must not mutate a new session.
  void queue.current.catch(()=>undefined).then(()=>restoreA0Session(a0DeviceStorage,target,lessons)).then(result=>{
   if(epoch.current!==session)return;
   if(result.kind!=='ok'){setError('El historial A0 no puede leerse. No se sobrescribirá.');setStatus('blocked');return;}
   current.current=result.journal;setJournal(result.journal);setStatus('ready');
  }).catch(()=>{if(epoch.current===session){setError('No se pudo acceder al almacenamiento A0.');setStatus('blocked');}});
  return()=>{epoch.current++;current.current=null;};
 },[target,lessons]);
 const submit=useCallback((lesson:A0LessonCandidate,event:A0JournalEvent)=>{
  if(status!=='ready'||!current.current||lesson.targetLanguage!==target)return;
  const session=epoch.current;
  // Queue each event in order; do not write into a different language after switching.
  queue.current=queue.current.catch(()=>undefined).then(async()=>{
   if(epoch.current!==session||!current.current)return;
   const saved=await commitA0Attempt(a0DeviceStorage,current.current,lesson,event);
   if(epoch.current!==session)return;
   current.current=saved;setJournal(saved);
  });
  void queue.current.catch(()=>{if(epoch.current===session){setStatus('blocked');setError('No se pudo guardar la respuesta. Se detuvo la sesión para proteger el historial.');}});
 },[status,target]);
 return {status,error,journal,progress:journal?a0JournalProgress(journal,lessons):null,submit};
}
