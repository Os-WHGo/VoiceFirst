/** Mobile A0 session hook: no candidate content is auto-published or bundled here. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {restoreA0Session,commitA0Attempt,a0JournalProgress,type A0Journal,type A0JournalEvent,type A0LessonCandidate,type TargetLanguage} from '@voicefirst/core';
import {a0DeviceStorage} from './a0-device-storage';
export function useA0Session(target:TargetLanguage,lessons:readonly A0LessonCandidate[]){
 const [journal,setJournal]=useState<A0Journal|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'blocked'>('loading');
 const [error,setError]=useState('');
 const queue=useRef(Promise.resolve());
 const current=useRef<A0Journal|null>(null);
 useEffect(()=>{
  let active=true;current.current=null;setJournal(null);setStatus('loading');setError('');
  void restoreA0Session(a0DeviceStorage,target,lessons).then(result=>{
   if(!active)return;
   if(result.kind!=='ok'){setError('El historial A0 no puede leerse. No se sobrescribirá.');setStatus('blocked');return;}
   current.current=result.journal;setJournal(result.journal);setStatus('ready');
  }).catch(()=>{if(active){setError('No se pudo acceder al almacenamiento A0.');setStatus('blocked');}});
  return()=>{active=false;};
 },[target,lessons]);
 const submit=useCallback((lesson:A0LessonCandidate,event:A0JournalEvent)=>{
  if(status!=='ready'||!current.current||lesson.targetLanguage!==target)return;
  queue.current=queue.current.catch(()=>undefined).then(async()=>{
   if(!current.current)return;
   const saved=await commitA0Attempt(a0DeviceStorage,current.current,lesson,event);
   current.current=saved;setJournal(saved);
  });
  void queue.current.catch(()=>{setStatus('blocked');setError('No se pudo guardar la respuesta. Se detuvo la sesión para proteger el historial.');});
 },[status,target]);
 return {status,error,journal,progress:journal?a0JournalProgress(journal,lessons):null,submit};
}
