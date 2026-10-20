/** A0 candidate preview. No lesson is bundled or marked publishable here. */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {a0LessonRoutes,nextA0LessonId,type A0LessonCandidate,type TargetLanguage} from '@voicefirst/core';
import {useA0Session} from './use-a0-session';
const palette={background:'#142339',text:'#F2F7FC',secondary:'#A6BBD0',accent:'#89D4C5'};
export function A0CandidatePreview({target,nativeLanguage,lessons}:{target:TargetLanguage;nativeLanguage:TargetLanguage;lessons:readonly A0LessonCandidate[]}){
 const eligible=useMemo(()=>lessons.filter(l=>l.targetLanguage===target&&l.publishable===false&&l.humanReviewRequired===true).sort((a,b)=>a.sequence-b.sequence),[target,lessons]);
 const session=useA0Session(target,eligible);
 const [chosen,setChosen]=useState<string|null>(null);
 const [feedback,setFeedback]=useState('');
 const [pending,setPending]=useState(false);
 const [lastSaved,setLastSaved]=useState<string|null>(null);
 const [lastOutcome,setLastOutcome]=useState<'correct'|'review'|null>(null);
 const inFlight=useRef(false);
 const viewEpoch=useRef(0);
 
 const routes=session.journal?a0LessonRoutes(eligible,session.journal):[];
 const suggested=session.journal?nextA0LessonId(eligible,session.journal):null;
 const selected=routes.find(r=>r.lessonId===chosen&&r.available)?.lessonId??suggested??routes.find(r=>r.completed)?.lessonId??null;
 const lesson=eligible.find(l=>l.lessonId===selected);
 useEffect(()=>{viewEpoch.current++;inFlight.current=false;setPending(false);setFeedback('');setLastSaved(null);setLastOutcome(null);},[target,selected,session.status]);
 const count=lesson?session.journal?.events.filter(e=>e.lessonId===lesson.lessonId).length??0:0;
 const completed=!!lesson&&routes.some(r=>r.lessonId===lesson.lessonId&&r.completed);
 const context=lesson?.contextByKnownLanguage[nativeLanguage];
 const prompt=lesson?.promptByKnownLanguage[nativeLanguage];
 const answer=async(optionId:string)=>{
  if(!lesson||session.status!=='ready'||!session.journal||inFlight.current)return;
  const eventId='a0.'+Date.now().toString(36)+'.'+Math.random().toString(36).slice(2,10);
  inFlight.current=true;
  const view=viewEpoch.current;
  setPending(true);
  setFeedback('Guardando respuesta en el dispositivo…');
  const saved=await session.submit(lesson,{eventId,lessonId:lesson.lessonId,selectedOptionId:optionId,attemptNumber:count+1});
  if(view!==viewEpoch.current)return;
  if(saved){setLastSaved(optionId);setLastOutcome(optionId===lesson.correctOptionId?'correct':'review');}
  setFeedback(saved?'Respuesta guardada en este dispositivo.':'No se confirmó el guardado. Revisa el estado de la sesión.');
  inFlight.current=false;
  setPending(false);
 };
 return <View style={styles.card}>
  <Text style={styles.heading}>Laboratorio A0 · contenido en revisión</Text>
  <Text style={styles.small}>Las actividades son candidatas y no certifican ningún nivel.</Text>
  {session.status==='loading'?<Text style={styles.small}>Recuperando progreso local…</Text>:null}
  {session.status==='blocked'?<Text style={styles.small}>{session.error}</Text>:null}
  {session.status==='ready'&&!lesson?<Text style={styles.small}>Todavía no hay lecciones A0 verificadas para mostrar.</Text>:null}
  {session.status==='ready'&&lesson?<View style={styles.content}>
   <Text style={styles.small}>{session.progress?.completedLessonIds.length??0} lecciones completadas en esta colección</Text>
   <View style={styles.options}>{routes.map(route=><Pressable key={route.lessonId} accessibilityRole="button" accessibilityLabel={'Lección '+route.sequence+(route.completed?' completada':route.available?' disponible':' bloqueada')} disabled={pending||!route.available} accessibilityState={{disabled:pending||!route.available,selected:route.lessonId===selected}} onPress={()=>{setChosen(route.lessonId);setFeedback('')}} style={styles.tab}><Text style={styles.text}>{route.sequence}{route.completed?' ✓':route.available?'':' 🔒'}</Text></Pressable>)}</View>
   {!lesson&&<Text style={styles.small}>No hay una siguiente lección disponible. Revisa el progreso o los requisitos de esta colección.</Text>}
   {lesson&&(!context||!prompt)?<Text style={styles.small}>Falta la ayuda en tu idioma. Esta actividad no puede mostrarse.</Text>:null}
   {lesson&&context&&prompt?<>
    <Text style={styles.text}>{context}</Text><Text style={styles.heading}>{prompt}</Text>
    {completed?<Text style={styles.small}>Esta lección ya está completada. Puedes revisarla sin registrar nuevas respuestas.</Text>:null}
    {lesson.options.map(option=><Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.text} accessibilityState={{disabled:pending||lastSaved!==null||completed}} disabled={pending||lastSaved!==null||completed} style={styles.option} onPress={()=>answer(option.id)}><Text style={styles.text}>{option.text}</Text></Pressable>)}
    {!!feedback&&<Text accessibilityLiveRegion="polite" style={styles.small}>{feedback}</Text>}
    {lastOutcome==='correct'?<Text accessibilityLiveRegion="polite" style={styles.small}>Respuesta correcta. Puedes continuar con la siguiente lección disponible.</Text>:null}
    {lastOutcome==='review'?<Text accessibilityLiveRegion="polite" style={styles.small}>Respuesta registrada. Revisa el contexto y vuelve a practicar esta lección.</Text>:null}
    {lastSaved!==null&&lastOutcome==='review'&&!completed?<Pressable accessibilityRole="button" style={styles.tab} onPress={()=>{setLastSaved(null);setLastOutcome(null);setFeedback('')}}><Text style={styles.text}>Intentar de nuevo</Text></Pressable>:null}
   </>:null}
  </View>:null}
 </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:palette.background,padding:18,borderRadius:16,gap:10},content:{gap:12},heading:{color:palette.text,fontWeight:'700',fontSize:17},text:{color:palette.text,fontSize:15},small:{color:palette.secondary,fontSize:12},options:{flexDirection:'row',flexWrap:'wrap',gap:8},tab:{padding:10,borderWidth:1,borderColor:palette.accent,borderRadius:8},option:{padding:14,borderWidth:1,borderColor:palette.accent,borderRadius:10}});
