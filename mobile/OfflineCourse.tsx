/** Curated course with genuine recall/checkpoints and durable local-only progress.
 * Written answers or strictly on-device ASR when available; not a phonetic assessment.
 * Speech playback is native, with offline availability depending on installed voices.
 */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,TextInput,StyleSheet} from 'react-native';
import {useOnDeviceAnswer,type DictationResult} from './use-on-device-answer';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
import Storage from 'expo-sqlite/kv-store';
import {lessonsFor,newCourseProgress,loadCourseState,courseStateToJSON,
  chooseCourseLesson,checkUtterance,recordCourseAttempt,finishLesson,courseLessonStatus,
  type CourseProgress,type TargetLanguage,voiceCueById} from '@voicefirst/core';

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
  const onDictation=useRef<(r:DictationResult,id:string)=>void>(()=>undefined);
  const mic=useOnDeviceAnswer(target,(result,id)=>onDictation.current(result,id));
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
    return()=>{valid=false;mounted.current=false;void stopCuratedVoice();};
  },[target]);
  const save=(next:CourseProgress)=>{
    setProgress(next);
    // Serialize writes. This screen persists no audio, transcripts or personal profiles.
    const raw=courseStateToJSON(next);
    writeQueue.current=writeQueue.current.catch(()=>undefined).then(()=>Storage.setItem(storeKey(target),raw));
    void writeQueue.current.catch(()=>{if(mounted.current){setLocked('No se pudo guardar el progreso. Se detuvo el curso para proteger tus datos.');setActive(false);}});
  };
  const play=()=>{
    if(!lesson||!current)return;
    const item=voiceCueById(`lesson/${lesson.id}/${current.id}`);
    if(!item)return;
    mic.stop();setSpeaking(true);
    void playCuratedVoice(item,rate,()=>setSpeaking(false),message=>{setSpeaking(false);setFeedback(message);});
  };
  const forward=()=>{
    if(!lesson)return;
    mic.stop();void stopCuratedVoice();setSpeaking(false);setAnswer('');setFeedback('');
    if(step<lesson.exercises.length-1){setStep(s=>s+1);return;}
    setStep(0);setActive(false);
  };
  const verify=(spoken=answer,confidence:'high'|'unknown'='high')=>{
    if(!progress||!lesson||!current||!spoken.trim()||locked)return;
    if(confidence!=='high'){
      setAnswer(spoken);
      setFeedback('La transcripción no tiene certeza suficiente. Puedes revisarla y confirmarla manualmente, sin penalización.');
      return;
    }
    const result=checkUtterance(current,spoken,target,'high');
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
  onDictation.current=(result,id)=>{
    if(!current||id!==current.id||current.type==='listen'||current.type==='repeat')return;
    verify(result.text,result.confidence);
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
        <View style={s.row}><Action label="Comprobar y guardar" onPress={()=>verify()}/><Action label="Escuchar pista" onPress={play}/></View>
        <View style={s.row}>
          <Action label={mic.listening?'Detener micrófono':'Responder hablando (offline)'} onPress={()=>{if(mic.listening)mic.stop();else{void stopCuratedVoice();setSpeaking(false);void mic.start(current!.id);}}}/>
          {mic.canDownload&&<Action label="Preparar modelo local (Android)" onPress={()=>void mic.downloadModel()}/>}
        </View>
        {!mic.available&&<Text style={s.warning}>Reconocimiento local no disponible. Puedes responder por escrito; nunca enviamos el audio a una API alternativa automáticamente.</Text>}
        {!!mic.issue&&<Text style={s.warning}>{mic.issue}</Text>}
        {!!feedback&&<Text style={s.muted}>{feedback}</Text>}
        <Text style={s.note}>Puedes responder hablando si tu teléfono dispone de reconocimiento local. Se evalúan transcripciones confiables, no la pronunciación ni todas las variantes válidas.</Text>
      </>}
    </>:<>
      <Text style={s.muted}>Objetivo: {lesson.context}. Escucha, repite, recuerda sin ver la respuesta y supera el control para guardar tu avance.</Text>
      <View style={s.row}><Action label="Empezar / continuar clase" onPress={()=>{setStep(0);setActive(true);setFeedback('');}}/></View>
    </>)}
    {progress&&!locked&&<View style={s.row}>{lessons.map(l=><Action key={l.id} label={`${l.band}: ${l.focusTag}${progress.completed.includes(l.id)?' ✓':''}`} onPress={()=>{
      if(courseLessonStatus(progress,l)==='locked'){setFeedback('Primero completa la lección anterior.');return;}
      setChosenId(l.id);setStep(0);setActive(false);setAnswer('');setFeedback('');mic.stop();void stopCuratedVoice();
    }}/>)}</View>}
    <Text style={s.note}>Se guarda progreso local sin audio ni transcripciones. Reconocimiento limitado al primer plano, al idioma y modelos instalados; no hay audio de fondo garantizado. La síntesis de voz del sistema tampoco está verificada sin Internet. Falta probar en hardware y cifrar datos sensibles.</Text>
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" style={s.btn} onPress={onPress}><Text style={s.btnTxt}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:11,marginTop:12},kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700',letterSpacing:1.2},heading:{fontSize:20,color:'#F2F7FC',fontWeight:'700'},muted:{fontSize:13,color:'#A6BBD0',lineHeight:20},stage:{color:'#89D4C5',fontSize:13,fontWeight:'700'},phrase:{color:'#F3DFC1',fontSize:18,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},btn:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,paddingVertical:12,paddingHorizontal:15,minHeight:44},btnTxt:{color:'#F2F7FC',fontWeight:'700',fontSize:12},input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:55,color:'#F2F7FC',fontSize:15},warning:{color:'#FFE19C',fontSize:12,lineHeight:18},note:{color:'#A6BBD0',fontSize:11,lineHeight:17}});
