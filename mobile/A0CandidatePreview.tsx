/** A0 candidate preview. No lesson is bundled or marked publishable here. */
import React,{useMemo,useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {type A0LessonCandidate,type TargetLanguage} from '@voicefirst/core';
import {useA0Session} from './use-a0-session';
const palette={background:'#142339',text:'#F2F7FC',secondary:'#A6BBD0',accent:'#89D4C5'};
export function A0CandidatePreview({target,nativeLanguage,lessons}:{target:TargetLanguage;nativeLanguage:TargetLanguage;lessons:readonly A0LessonCandidate[]}){
 const eligible=useMemo(()=>lessons.filter(l=>l.targetLanguage===target&&l.publishable===false&&l.humanReviewRequired===true).sort((a,b)=>a.sequence-b.sequence),[target,lessons]);
 const session=useA0Session(target,eligible);
 const [chosen,setChosen]=useState<string|null>(null);
 const [feedback,setFeedback]=useState('');
 const lesson=eligible.find(l=>l.lessonId===chosen)??eligible[0];
 const count=lesson?session.journal?.events.filter(e=>e.lessonId===lesson.lessonId).length??0:0;
 const context=lesson?.contextByKnownLanguage[nativeLanguage];
 const prompt=lesson?.promptByKnownLanguage[nativeLanguage];
 const answer=(optionId:string)=>{
  if(!lesson||session.status!=='ready'||!session.journal)return;
  const eventId='a0.'+Date.now().toString(36)+'.'+Math.random().toString(36).slice(2,10);
  session.submit(lesson,{eventId,lessonId:lesson.lessonId,selectedOptionId:optionId,attemptNumber:count+1});
  setFeedback('Respuesta enviada para guardar. Revisa el progreso al terminar.');
 };
 return <View style={styles.card}>
  <Text style={styles.heading}>Laboratorio A0 · contenido en revisión</Text>
  <Text style={styles.small}>Las actividades son candidatas y no certifican ningún nivel.</Text>
  {session.status==='loading'?<Text style={styles.small}>Recuperando progreso local…</Text>:null}
  {session.status==='blocked'?<Text style={styles.small}>{session.error}</Text>:null}
  {session.status==='ready'&&!lesson?<Text style={styles.small}>Todavía no hay lecciones A0 verificadas para mostrar.</Text>:null}
  {session.status==='ready'&&lesson?<View style={styles.content}>
   <Text style={styles.small}>{session.progress?.completedLessonIds.length??0} lecciones completadas en esta colección</Text>
   <View style={styles.options}>{eligible.map(l=><Pressable key={l.lessonId} accessibilityRole="button" onPress={()=>{setChosen(l.lessonId);setFeedback('')}} style={styles.tab}><Text style={styles.text}>{l.sequence}</Text></Pressable>)}</View>
   {!context||!prompt?<Text style={styles.small}>Falta la ayuda en tu idioma. Esta actividad no puede mostrarse.</Text>:<>
    <Text style={styles.text}>{context}</Text><Text style={styles.heading}>{prompt}</Text>
    {lesson.options.map(option=><Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.text} style={styles.option} onPress={()=>answer(option.id)}><Text style={styles.text}>{option.text}</Text></Pressable>)}
    {!!feedback&&<Text style={styles.small}>{feedback}</Text>}
   </>}
  </View>:null}
 </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:palette.background,padding:18,borderRadius:16,gap:10},content:{gap:12},heading:{color:palette.text,fontWeight:'700',fontSize:17},text:{color:palette.text,fontSize:15},small:{color:palette.secondary,fontSize:12},options:{flexDirection:'row',flexWrap:'wrap',gap:8},tab:{padding:10,borderWidth:1,borderColor:palette.accent,borderRadius:8},option:{padding:14,borderWidth:1,borderColor:palette.accent,borderRadius:10}});
