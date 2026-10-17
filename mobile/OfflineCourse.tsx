/** Offline authored microcourse reader. Does not claim offline ASR or pronunciation evaluation. */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { lessonsFor, nextAudioStep, type TargetLanguage } from '@voicefirst/core';

export function OfflineCourse({ nativeLanguage,target, rate=0.88 }: {nativeLanguage:TargetLanguage;target:TargetLanguage;rate?:number}) {
  const lessons=useMemo(()=>lessonsFor(target),[target]);
  const [lessonIndex,setLessonIndex]=useState(0);
  const [step,setStep]=useState(0);
  const [active,setActive]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  useEffect(()=>{setLessonIndex(0);setStep(0);setActive(false);void Speech.stop();},[target]);
  useEffect(()=>()=>{void Speech.stop();},[]);
  const lesson=lessons[lessonIndex] ?? lessons[0];
  if(!lesson)return null;
  const current=lesson.exercises[step];
  const play=()=>{
    const audio=nextAudioStep(lesson,step,nativeLanguage);
    if(!audio)return;
    void Speech.stop();setSpeaking(true);
    Speech.speak(audio.speech,{language:audio.language,rate,onDone:()=>setSpeaking(false),onStopped:()=>setSpeaking(false),onError:()=>setSpeaking(false)});
  };
  const forward=()=>{
    void Speech.stop();setSpeaking(false);
    if(step<lesson.exercises.length-1){setStep(step+1);return;}
    // A completed listening walkthrough DOES NOT imply mastery. Progress requires recognized speech.
    setStep(0);setActive(false);
  };
  return <View style={s.wrap}>
    <Text style={s.kicker}>CURSO PREPARADO · EJEMPLO SIN API</Text>
    <Text style={s.heading}>La clase de hoy</Text>
    <Text style={s.muted}>Ruta {lessonIndex+1} de {lessons.length} · {lesson.band} · {lesson.goal[nativeLanguage]}</Text>
    {active ? <>
      <Text style={s.stage}>Paso {step+1}/{lesson.exercises.length}: {current?.type}</Text>
      <Text style={s.phrase}>{current?.utterance}</Text>
      <Text style={s.muted}>Significado: {current?.meaning[nativeLanguage]}</Text>
      <View style={s.row}>
        <Action label={speaking?'Reproduciendo…':'Escuchar / repetir'} onPress={play}/>
        <Action label={step===lesson.exercises.length-1?'Finalizar escucha':'Siguiente'} onPress={forward}/>
      </View>
      <Text style={s.note}>Esta demostración permite escuchar y practicar. Todavía no reconoce ni puntúa la voz sin conexión; finalizarla no certifica dominio. La ruta con ASR local será un bloque posterior.</Text>
    </> : <>
      <Text style={s.muted}>Objetivo: {lesson.context}. Incluye ejemplos originales, escucha, repetición, recuperación y control de progreso.</Text>
      <View style={s.row}>
        <Action label="Empezar lección" onPress={()=>{setStep(0);setActive(true);}} />
        {lessons.length>1 && <Action label="Otra lección" onPress={()=>{setLessonIndex((lessonIndex+1)%lessons.length);setStep(0);}}/>}
      </View>
    </>}
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" style={s.btn} onPress={onPress}><Text style={s.btnTxt}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:11,marginTop:12},kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700',letterSpacing:1.2},heading:{fontSize:20,color:'#F2F7FC',fontWeight:'700'},muted:{fontSize:13,color:'#A6BBD0',lineHeight:20},stage:{color:'#89D4C5',fontSize:13,fontWeight:'700'},phrase:{color:'#F3DFC1',fontSize:18,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},btn:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,paddingVertical:12,paddingHorizontal:15,minHeight:44},btnTxt:{color:'#F2F7FC',fontWeight:'700',fontSize:12},note:{color:'#A6BBD0',fontSize:11,lineHeight:17}});
