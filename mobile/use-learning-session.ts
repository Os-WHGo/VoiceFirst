import {useEffect,useMemo,useRef,useState} from 'react';
import {checkpointWithSession,courseActivities,courseLessonStatus,deviceLocalDay,lessonsFor,planLearningSession,sessionOpening,stepLearningCheckpoint,type ExperiencePreferences,type LearningCheckpoint,type LearningSessionEvent,type LearningSessionOutput,sessionPreferencesFrom,type TargetLanguage} from '@voicefirst/core';
import {loadLearningCheckpoint,saveLearningCheckpoint} from './learning-checkpoint-storage';

/** Serialize durable transitions. UI only advances after SQLite commits successfully. */
export function useLearningSession(target:TargetLanguage,known:TargetLanguage,experience:ExperiencePreferences){
 const [value,setValue]=useState<LearningCheckpoint|null>(null);
 const [outputs,setOutputs]=useState<LearningSessionOutput[]>([]);
 const [busy,setBusy]=useState(false);
 const [blockedTarget,setBlockedTarget]=useState<TargetLanguage|null>(null);
 const current=useRef<{checkpoint:LearningCheckpoint;raw:string|null}|null>(null);
 const gate=useRef(false),mounted=useRef(false);
 const generation=useRef(0),busyTarget=useRef<TargetLanguage|null>(null);
 const activities=useMemo(()=>courseActivities(target),[target]);
 useEffect(()=>{
  // A different target must never inherit an earlier course or its pending commands.
  // Old reads and writes can finish asynchronously; generation ownership stops
  // them from displaying or blocking the newly selected language.
  const token=++generation.current;
  let cancelled=false;
  mounted.current=true;
  current.current=null;gate.current=false;busyTarget.current=null;
  setValue(null);setOutputs([]);setBusy(false);setBlockedTarget(null);
  void loadLearningCheckpoint(target).then(entry=>{
   if(cancelled||!mounted.current||generation.current!==token)return;
   if(entry.checkpoint.target!==target)throw new Error('CHECKPOINT_TARGET_MISMATCH');
   current.current=entry;setValue(entry.checkpoint);
  }).catch(()=>{
   if(!cancelled&&mounted.current&&generation.current===token)setBlockedTarget(target);
  });
  return()=>{
   cancelled=true;
   if(generation.current===token)generation.current++;
   mounted.current=false;current.current=null;gate.current=false;busyTarget.current=null;
  };
 },[target]);
 async function transition(event:LearningSessionEvent|'start'|{type:'start-lesson';lessonId:string}){
  const previous=current.current;
  // Guard the gap between a prop change and effect cleanup, too.
  if(gate.current||!previous||previous.checkpoint.target!==target||blockedTarget===target)return;
  const token=generation.current;
  gate.current=true;busyTarget.current=target;setBusy(true);
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
   if(!mounted.current||generation.current!==token)return;
   current.current={checkpoint,raw};
   setValue(checkpoint);setOutputs(nextOutputs);
  }catch{
   // A failure from an abandoned language cannot block the selected one.
   // Preserve the previous checkpoint and stored bytes without auto-retry.
   if(mounted.current&&generation.current===token)setBlockedTarget(target);
  }finally{
   if(generation.current===token){
    gate.current=false;busyTarget.current=null;
    if(mounted.current)setBusy(false);
   }
  }
 }
 // Hide stale state immediately, including the render before the effect resets it.
 const visible=!!current.current&&current.current.checkpoint===value&&value.target===target;
 return {value:visible?value:null,outputs:visible?outputs:[],busy:busy&&busyTarget.current===target,blocked:blockedTarget===target,transition,activities};
}
