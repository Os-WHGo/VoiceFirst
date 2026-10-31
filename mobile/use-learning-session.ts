import {useEffect,useMemo,useRef,useState} from 'react';
import {checkpointWithSession,courseActivities,courseLessonStatus,deviceLocalDay,lessonsFor,planLearningSession,sessionOpening,stepLearningCheckpoint,type ExperiencePreferences,type LearningCheckpoint,type LearningSessionEvent,type LearningSessionOutput,sessionPreferencesFrom,type TargetLanguage} from '@voicefirst/core';
import {loadLearningCheckpoint,saveLearningCheckpoint} from './learning-checkpoint-storage';

/** Serialize durable transitions. UI only advances after SQLite commits successfully. */
export function useLearningSession(target:TargetLanguage,known:TargetLanguage,experience:ExperiencePreferences){
 const [value,setValue]=useState<LearningCheckpoint|null>(null);
 const [outputs,setOutputs]=useState<LearningSessionOutput[]>([]);
 const [busy,setBusy]=useState(false);
 const [blocked,setBlocked]=useState(false);
 const current=useRef<{checkpoint:LearningCheckpoint;raw:string|null}|null>(null);
 const gate=useRef(false),mounted=useRef(false);
 const activities=useMemo(()=>courseActivities(target),[target]);
 useEffect(()=>{
  mounted.current=true;
  void loadLearningCheckpoint(target).then(entry=>{
   if(!mounted.current)return;
   current.current=entry;setValue(entry.checkpoint);
  }).catch(()=>{if(mounted.current)setBlocked(true);});
  return()=>{mounted.current=false;};
 },[target]);
 async function transition(event:LearningSessionEvent|'start'|{type:'start-lesson';lessonId:string}){
  if(gate.current||!current.current||blocked)return;
  gate.current=true;setBusy(true);
  const previous=current.current;
  try{
   let checkpoint:LearningCheckpoint,nextOutputs:LearningSessionOutput[];
   if(event==='start'||event.type==='start-lesson'){
    // Never replace an unfinished session, including one in another known language.
    if(previous.checkpoint.session&&previous.checkpoint.session.status!=='finished')return;
    const lessonId=event==='start'?null:event.lessonId;
    const lesson=lessonId?lessonsFor(target).find(l=>l.id===lessonId):null;
    if(lessonId&&(!lesson||courseLessonStatus(previous.checkpoint.progress,lesson)==='locked'))return;
    const pool=lessonId?activities.filter(a=>a.lessonId===lessonId):activities;
    const completed=lessonId?previous.checkpoint.progress.completed.filter(id=>id!==lessonId):previous.checkpoint.progress.completed;
    const session=planLearningSession({sessionId:`local-${Date.now()}-${previous.checkpoint.revision+1}`,target,known,today:deviceLocalDay(),activities:pool,
     model:previous.checkpoint.model,completedLessons:completed,preferences:sessionPreferencesFrom(experience)});
    checkpoint=checkpointWithSession(previous.checkpoint,session);
    nextOutputs=sessionOpening(session,activities);
   }else{
    const result=stepLearningCheckpoint(previous.checkpoint,event,activities,deviceLocalDay());
    checkpoint=result.checkpoint;nextOutputs=result.outputs;
   }
   const raw=await saveLearningCheckpoint(checkpoint,previous.raw);
   current.current={checkpoint,raw};
   if(mounted.current){setValue(checkpoint);setOutputs(nextOutputs);}
  }catch{
   // Keep both the last committed snapshot and stored bytes; no automatic reset/retry.
   if(mounted.current)setBlocked(true);
  }finally{
   gate.current=false;if(mounted.current)setBusy(false);
  }
 }
 return {value,outputs,busy,blocked,transition,activities};
}
