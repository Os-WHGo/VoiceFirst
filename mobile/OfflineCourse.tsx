/** Curated course with genuine recall/checkpoints and durable local-only progress.
 * The exercise currently uses typed answers; it is not a phonetic assessment or ASR.
 * Speech playback is native, with offline availability depending on installed voices.
 */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,TextInput,StyleSheet} from 'react-native';
import * as Speech from 'expo-speech';
import Storage from 'expo-sqlite/kv-store';
import {lessonsFor,nextAudioStep,newCourseProgress,loadCourseState,courseStateToJSON,
  chooseCourseLesson,checkUtterance,recordCourseAttempt,finishLesson,courseLessonStatus,
  type CourseProgress,type OfflineLesson,type TargetLanguage} from '@voicefirst/core';

const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const storeKey=(language:TargetLanguage)=>`voicefirst.curriculum.v1.${language}`;
export function OfflineCourse({nativeLanguage,target,rate=0.88}:{nativeLanguage:TargetLanguage;target:TargetLanguage;rate?:number}) {
  const lessons=useMemo(()=>lessonsFor(target),[target]);
  const [progress,setProgress]=useState<CourseProgress|null>(null);
  const [locked,setLocked]=useState('');
  const [chosenId,setChosenId]=useState<string|null>(null);
  const [step,setStep]=useState(0);
  const [active,setActive]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [answer,setAnswer]=useState('');
  const [feedback,setFeedback]=useState('');
  const mounted=useRef(true);
  const writeQueue=useRef(Promise.resolve());
  const lesson=lessons.find(x=>x.id===chosenId)??lessons[0];
  const current=lesson?.exercises[step];
  useEffect(()=>{
    mounted.current=true;let valid=true;
    setProgress(null);setLocked('');setStep(0);setActive(false);setAnswer('');
    void Storage.getItem(storeKey(target)).then(raw=>{
      if(!valid)return;
      const result=raw===null?{kind:'ok',progress:newCourseProgress(target)} as const:loadCourseState(raw,target);
      if(result.kind!=='ok'){setLocked('Los datos de este curso no pueden leerse. No se han borrado; continúa sin reemplazarlos.');return;}
      setProgress(result.progress);
      setChosenId(chooseCourseLesson(result.progress,localDay())?.id??lessons[0]?.id??null);
    }).catch(()=>{if(valid)setLocked('No se pudo abrir la base de datos local.');});
    return()=>{valid=false;mounted.current=false;void Speech.stop();};
  },[target]);
  const save=(next:CourseProgress)=>{
    setProgress(next);
    // Serialize writes. This screen persists no audio, transcripts or personal profiles.
    const raw=courseStateToJSON(next);
    writeQueue.current=writeQueue.current.catch(()=>undefined).then(()=>Storage.setItem(storeKey(target),raw));
    void writeQueue.current.catch(()=>{if(mounted.current){setLocked('No se pudo guardar el progreso. Se detuvo el curso para proteger tus datos.');setActive(false);}});
  };
  const play=()=>{
    if(!lesson)return;
    const audio=nextAudioStep(lesson,step,nativeLanguage);
    if(!audio)return;
    void Speech.stop();setSpeaking(true);
    Speech.speak(audio.speech,{language:audio.language,rate,onDone:()=>setSpeaking(false),onStopped:()=>setSpeaking(false),onError:()=>setSpeaking(false)});
  };
  const forward=()=>{
    if(!lesson)return;
    void Speech.stop();setSpeaking(false);setAnswer('');setFeedback('');
    if(step<lesson.exercises.length-1){setStep(s=>s+1);return;}
    setStep(0);setActive(false);
  };
  const verify=()=>{
    if(!progress||!lesson||!current||!answer.trim()||locked)return;
    const result=checkUtterance(current,answer,target,'high');
    const next=recordCourseAttempt(progress,current,result,localDay());
    if(result.kind==='match'){
      const final=current.type==='checkpoint'?finishLesson(next,lesson):next;
      save(final);
      setFeedback('Respuesta de ejemplo aceptada.');
      if(current.type==='checkpoint' && !final.completed.includes(lesson.id)){
        setFeedback('Faltan resultados de recuperación para completar la lección.');return;
      }
      forward();
      if(current.type==='checkpoint'){
        setChosenId(chooseCourseLesson(final,localDay())?.id??lesson.id);
      }
    }else if(result.kind==='retry'){
      save(next);
      setFeedback('Todavía no coincide con nuestras respuestas de ejemplo. Puedes escuchar otra vez y elegir tus palabras.');
    }else setFeedback('No pudimos interpretar la respuesta; no se contó como fallo.');
  };
  if(!lesson)return null;
  const status=progress?courseLessonStatus(progress,lesson):'locked';
  return <View style={s.wrap}>
    <Text style={s.kicker}>CURSO PROGRAMADO · SIN IA · PROGRESO LOCAL</Text>
    <Text style={s.heading}>Clase de hoy</Text>
    {!!locked && <Text style={s.warning}>{locked}</Text>}
    {!progress&&!locked&&<Text style={s.muted}>Recuperando tu progreso…</Text>}
    <Text style={s.muted}>{lesson.band} · {lesson.goal[nativeLanguage]} · {status==='completed'?'Repaso':'Lección'} · {progress?.completed.length??0}/{lessons.length} completadas</Text>
    {progress&&!locked&&(active? <>
      <Text style={s.stage}>Paso {step+1}/{lesson.exercises.length}: {current?.type}</Text>
      {current?.type==='listen'||current?.type==='repeat'?<>
        <Text style={s.phrase}>{current?.utterance}</Text>
        <Text style={s.muted}>{current?.meaning[nativeLanguage]}</Text>
        <View style={s.row}><Action label={speaking?'Reproduciendo…':'Escuchar modelo'} onPress={play}/><Action label="Continuar" onPress={forward}/></View>
        <Text style={s.note}>Escuchar y repetir son práctica, no prueba de aprendizaje. La comprobación llegará después.</Text>
      </>:<>
        <Text style={s.muted}>Responde en {target}. Recuerda una frase apropiada para esta situación:</Text>
        <Text style={s.phrase}>{current?.meaning[nativeLanguage]}</Text>
        <TextInput accessibilityLabel="Respuesta de recuperación en el idioma objetivo" value={answer} onChangeText={setAnswer} style={s.input} placeholder="Tu respuesta aquí" placeholderTextColor="#9FB4C6" autoCorrect={false}/>
        <View style={s.row}><Action label="Comprobar y guardar" onPress={verify}/><Action label="Escuchar pista" onPress={play}/></View>
        {!!feedback&&<Text style={s.muted}>{feedback}</Text>}
        <Text style={s.note}>Comprobación escrita de prueba. Aún no puntúa respuestas habladas de esta sección ni reconoce todas las variantes válidas.</Text>
      </>}
    </>:<>
      <Text style={s.muted}>Objetivo: {lesson.context}. Escucha, repite, recuerda sin ver la respuesta y supera el control para guardar tu avance.</Text>
      <View style={s.row}><Action label="Empezar / continuar clase" onPress={()=>{setStep(0);setActive(true);setFeedback('');}}/></View>
    </>)}
    {progress&&!locked&&<View style={s.row}>{lessons.map(l=><Action key={l.id} label={`${l.band}: ${l.focusTag}${progress.completed.includes(l.id)?' ✓':''}`} onPress={()=>{
      if(courseLessonStatus(progress,l)==='locked'){setFeedback('Primero completa la lección anterior.');return;}
      setChosenId(l.id);setStep(0);setActive(false);setAnswer('');setFeedback('');void Speech.stop();
    }}/>)}</View>}
    <Text style={s.note}>Solo se guardan los IDs de ejercicios, intentos y días de repaso. No se almacena voz ni texto de respuestas. El almacenamiento es local y no está cifrado. Pendiente: ejercicios de voz de este módulo, funcionamiento con pantalla apagada y pruebas móviles reales.</Text>
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" style={s.btn} onPress={onPress}><Text style={s.btnTxt}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:11,marginTop:12},kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700',letterSpacing:1.2},heading:{fontSize:20,color:'#F2F7FC',fontWeight:'700'},muted:{fontSize:13,color:'#A6BBD0',lineHeight:20},stage:{color:'#89D4C5',fontSize:13,fontWeight:'700'},phrase:{color:'#F3DFC1',fontSize:18,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},btn:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,paddingVertical:12,paddingHorizontal:15,minHeight:44},btnTxt:{color:'#F2F7FC',fontWeight:'700',fontSize:12},input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:55,color:'#F2F7FC',fontSize:15},warning:{color:'#FFE19C',fontSize:12,lineHeight:18},note:{color:'#A6BBD0',fontSize:11,lineHeight:17}});
