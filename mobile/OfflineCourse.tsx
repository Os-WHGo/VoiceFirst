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
  chooseCourseLesson,checkUtterance,recordCourseAttempt,finishLesson,courseLessonStatus,courseReviewQueue,courseReviewSummary,voluntaryCourseReview,
  type CourseProgress,type TargetLanguage,voiceCueById,type ExperiencePreferences,defaultExperiencePreferences,
  currentVoiceTurn,voiceTranscriptDisposition} from '@voicefirst/core';

const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const storeKey=(language:TargetLanguage)=>`voicefirst.curriculum.v1.${language}`;
const cursorKey=(language:TargetLanguage)=>`voicefirst.curriculum.cursor.v1.${language}`;
export function OfflineCourse({nativeLanguage,target,rate=0.88,experience=defaultExperiencePreferences}:{nativeLanguage:TargetLanguage;target:TargetLanguage;rate?:number;experience?:ExperiencePreferences}) {
  const lessons=useMemo(()=>lessonsFor(target),[target]);
  const [progress,setProgress]=useState<CourseProgress|null>(null);
  const [locked,setLocked]=useState('');
  const [chosenId,setChosenId]=useState<string|null>(null);
  const [step,setStep]=useState(0);
  const [reviewExerciseId,setReviewExerciseId]=useState<string|null>(null);
  const [active,setActive]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [answer,setAnswer]=useState('');
  const [feedback,setFeedback]=useState('');
  const [passed,setPassed]=useState(false);
  const [requestedDetail,setRequestedDetail]=useState('');
  const [sessionSummary,setSessionSummary]=useState('');
  const [showContext,setShowContext]=useState(false);
  const deferred=useRef<string[]>([]);
  const mounted=useRef(true);
  const playbackEpoch=useRef(0);
  const writeQueue=useRef(Promise.resolve());
  const onDictation=useRef<(r:DictationResult,id:string)=>void>(()=>undefined);
  const mic=useOnDeviceAnswer(target,(result,id)=>onDictation.current(result,id));
  const lesson=lessons.find(x=>x.id===chosenId)??lessons[0];
  const current=lesson?.exercises[step];
  const today=localDay();
  const reviewSummary=progress?courseReviewSummary(progress,today):null;
  const reviewQueue=progress?courseReviewQueue(progress,today):[];
  useEffect(()=>{
    mounted.current=true;let valid=true;
    playbackEpoch.current++;setProgress(null);setLocked('');setStep(0);setReviewExerciseId(null);setActive(false);setAnswer('');setPassed(false);setSessionSummary('');deferred.current=[];
    void Promise.all([Storage.getItem(storeKey(target)),Storage.getItem(cursorKey(target))]).then(([raw,cursor])=>{
      if(!valid)return;
      const result=raw===null?{kind:'ok',progress:newCourseProgress(target)} as const:loadCourseState(raw,target);
      if(result.kind!=='ok'){setLocked('Los datos de este curso no pueden leerse. No se han borrado; continúa sin reemplazarlos.');return;}
      setProgress(result.progress);
      const suggested=chooseCourseLesson(result.progress,localDay())?.id??lessons[0]?.id??null;
      let resume: {lessonId:string;step:number;active:boolean}|null=null;
      if(cursor!==null && experience.returnToLastStep){
        try{
          const value:unknown=JSON.parse(cursor);
          if(value && typeof value==='object'){
            const c=value as {lessonId?:unknown;step?:unknown;active?:unknown};
            const old=lessons.find(x=>x.id===c.lessonId);
            if(old && (old.prerequisite===undefined||result.progress.completed.includes(old.prerequisite)) &&
                Number.isSafeInteger(c.step) && typeof c.step==='number' && c.step>=0 && c.step<old.exercises.length && typeof c.active==='boolean'){
              resume={lessonId:old.id,step:c.step,active:c.active};
            }
          }
        }catch{/* Cursor is optional; never overwrite or lose course evidence because of it. */}
      }
      setChosenId(resume?.lessonId??suggested);setStep(resume?.step??0);setActive(resume?.active??false);
    }).catch(()=>{if(valid)setLocked('No se pudo abrir la base de datos local.');});
    return()=>{valid=false;mounted.current=false;playbackEpoch.current++;mic.stop();void stopCuratedVoice();};
  },[target]);
  useEffect(()=>{
    if(!progress||!chosenId)return;
    const raw=JSON.stringify({lessonId:chosenId,step,active});
    writeQueue.current=writeQueue.current.catch(()=>undefined).then(()=>Storage.setItem(cursorKey(target),raw));
    void writeQueue.current.catch(()=>{if(mounted.current){setLocked('No se pudo guardar el punto de reanudación. El curso queda pausado.');setActive(false);}});
  },[target,progress===null,chosenId,step,active]);
  const save=(next:CourseProgress)=>{
    setProgress(next);
    // Serialize writes. This screen persists no audio, transcripts or personal profiles.
    const raw=courseStateToJSON(next);
    writeQueue.current=writeQueue.current.catch(()=>undefined).then(()=>Storage.setItem(storeKey(target),raw));
    void writeQueue.current.catch(()=>{if(mounted.current){setLocked('No se pudo guardar el progreso. Se detuvo el curso para proteger tus datos.');setActive(false);}});
  };
  const play=(thenListen=false)=>{
    if(!lesson||!current||!active||locked)return;
    const item=voiceCueById(`lesson/${lesson.id}/${current.id}`);
    if(!item)return;
    const epoch=++playbackEpoch.current;
    mic.stop();setSpeaking(true);
    void playCuratedVoice(item,rate,()=>{
      if(epoch!==playbackEpoch.current||!mounted.current)return;
      setSpeaking(false);
      if(thenListen && current.type!=='listen' && current.type!=='repeat' && !passed){
        void mic.start(`${lesson.id}:${current.id}`).then(ok=>{
          if(epoch===playbackEpoch.current&&!ok)setFeedback('El micrófono local no está disponible; puedes responder por texto.');
        });
      }
    },message=>{if(epoch===playbackEpoch.current){setSpeaking(false);setFeedback(message);}});
  
  };
  const forward=()=>{
    if(!lesson)return;
    playbackEpoch.current++;mic.stop();void stopCuratedVoice();setSpeaking(false);setAnswer('');setFeedback('');setRequestedDetail('');setPassed(false);setShowContext(false);
    if(reviewExerciseId){setReviewExerciseId(null);setSessionSummary('Repaso finalizado. Puedes continuar el curso o elegir otro repaso.');deferred.current=[];setStep(0);setActive(false);return;}
    if(step<lesson.exercises.length-1){setStep(s=>s+1);return;}
    setSessionSummary(experience.correctionTiming==='after-exercise'&&deferred.current.length ? deferred.current.join(' · ') : 'Ejercicio terminado. Puedes continuar con otra clase o repasar.');
    deferred.current=[];setStep(0);setActive(false);
  };
  const verify=(spoken=answer,confidence:'high'|'unknown'='high')=>{
    if(!progress||!lesson||!current||!spoken.trim()||locked||passed)return;
    if(confidence!=='high'){
      setAnswer(spoken);
      setFeedback('La transcripción no tiene certeza suficiente. Revísala y confírmala manualmente, sin penalización.');
      return;
    }
    const result=checkUtterance(current,spoken,target,'high');
    const next=recordCourseAttempt(progress,current,result,localDay());
    if(result.kind==='match'){
      const final=current.type==='checkpoint'&&!reviewExerciseId?finishLesson(next,lesson):next;
      save(final);
      if(current.type==='checkpoint' && !reviewExerciseId && !final.completed.includes(lesson.id)){
        setFeedback('Todavía faltan resultados de recuperación para terminar la lección.');return;
      }
      setPassed(true);
      const detail='Respuesta de ejemplo aceptada. Puedes revisar otras alternativas en futuras prácticas.';
      deferred.current.push(detail);
      setRequestedDetail(experience.correctionTiming==='on-request'?detail:'');
      setFeedback(experience.correctionTiming==='after-each-answer'?detail:'Respuesta aceptada. Puedes continuar.');
      if(current.type==='checkpoint')setChosenId(lesson.id);
    }else if(result.kind==='retry'){
      save(next);
      const detail='No coincide con las respuestas revisadas. Podría existir otra formulación válida. Escucha la pista y vuelve a intentarlo.';
      setRequestedDetail(experience.correctionTiming==='on-request'?detail:'');
      setFeedback(experience.correctionTiming==='after-each-answer'?detail:'Todavía no podemos aceptar esta respuesta. Puedes intentarlo de nuevo.');
    }else setFeedback('La respuesta no se interpretó con seguridad. No se contó como error.');
  };
  onDictation.current=(result,id)=>{
    if(!current||!lesson||!active||!currentVoiceTurn(`${lesson.id}:${current.id}`,id,!locked)||current.type==='listen'||current.type==='repeat'||passed)return;
    const mode=voiceTranscriptDisposition({text:result.text,confidence:result.confidence,answerControl:experience.answerControl,final:true});
    if(mode==='ignore')return;
    setAnswer(result.text);
    if(mode==='confirm'){
      setFeedback(result.confidence==='unknown'
        ?'El reconocimiento local es incierto. Revisa la frase y confirma manualmente, sin penalización.'
        :'Frase reconocida. Revísala y pulsa «Comprobar y guardar» para evaluarla.');
      return;
    }
    verify(result.text,'high');
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
      <Text style={s.stage}>{reviewExerciseId?'Repaso individual':`Paso ${step+1}/${lesson.exercises.length}`}: {current?.type}</Text>
      <Action label="Pausar clase" onPress={()=>{playbackEpoch.current++;mic.stop();void stopCuratedVoice();setSpeaking(false);setActive(false);}}/>
      {current?.type==='listen'||current?.type==='repeat'?<>
        <Text style={s.phrase}>{current?.utterance}</Text>
        {(experience.instructionFormat==='full-context'||showContext)&&<Text style={s.muted}>{current?.meaning[nativeLanguage]}</Text>}
        {experience.instructionFormat==='one-step'&&<Action label={showContext?'Ocultar ayuda':'Mostrar significado'} onPress={()=>setShowContext(x=>!x)}/>}
        <View style={s.row}><Action label={speaking?'Reproduciendo…':'Escuchar modelo'} onPress={()=>play()}/><Action label="Continuar" onPress={forward}/></View>
        <Text style={s.note}>Escuchar y repetir son práctica, no prueba de aprendizaje. La comprobación llegará después.</Text>
      </>:<>
        {experience.instructionFormat==='full-context'&&<Text style={s.muted}>Responde en {target}. Recuerda una frase apropiada para esta situación:</Text>}
        <Text style={s.phrase}>{current?.meaning[nativeLanguage]}</Text>
        <TextInput accessibilityLabel="Respuesta de recuperación en el idioma objetivo" value={answer} onChangeText={setAnswer} style={s.input} placeholder="Tu respuesta aquí" placeholderTextColor="#9FB4C6" autoCorrect={false}/>
        <View style={s.row}>{!passed&&<Action label="Comprobar y guardar" onPress={()=>verify()}/>}<Action label="Escuchar pista" onPress={()=>play()}/>{passed&&<Action label="Continuar al siguiente paso" onPress={forward}/>}</View>
        <View style={s.row}>
          {!passed&&<Action label={mic.listening?'Detener micrófono':'Responder hablando (offline)'} onPress={()=>{
            if(mic.listening){mic.stop();return;}
            playbackEpoch.current++;void stopCuratedVoice();setSpeaking(false);
            void mic.start(`${lesson.id}:${current!.id}`);
          }}/>}
          {!passed&&<Action label="Escuchar y responder" onPress={()=>play(true)}/>}
          {mic.canDownload&&<Action label="Preparar modelo local (Android)" onPress={()=>void mic.downloadModel()}/>}
        </View>
        {!mic.available&&<Text style={s.warning}>Reconocimiento local no disponible. Puedes responder por escrito; nunca enviamos el audio a una API alternativa automáticamente.</Text>}
        {mic.model==='missing'&&<Text style={s.warning}>Falta instalar el modelo offline de este idioma; la respuesta escrita sigue disponible.</Text>}
        {mic.model==='installed'&&<Text style={s.note}>El sistema informa de un modelo local instalado. Todavía necesita validación física.</Text>}
        {!!mic.issue&&<Text style={s.warning}>{mic.issue}</Text>}
        {mic.canDownload&&<Action label="Comprobar modelo local" onPress={()=>void mic.checkModel()}/>}
        {!!feedback&&<Text style={s.muted}>{feedback}</Text>}
        {!!requestedDetail&&<Action label="Mostrar explicación" onPress={()=>{setFeedback(requestedDetail);setRequestedDetail('');}}/>}
        <Text style={s.note}>Puedes responder hablando si tu teléfono dispone de reconocimiento local. Se evalúan transcripciones confiables, no la pronunciación ni todas las variantes válidas.</Text>
      </>}
    </>:<>
      <Text style={s.muted}>{experience.instructionFormat==='one-step'?'Escucha la pregunta y avanza a tu ritmo.':`Objetivo: ${lesson.context}. Escucha, repite y supera el control para guardar tu avance.`}</Text>
      {!!sessionSummary&&<Text style={s.muted}>{sessionSummary}</Text>}
      <View style={s.row}><Action label="Empezar / continuar clase" onPress={()=>{if(!experience.returnToLastStep)setStep(0);setActive(true);setPassed(false);setFeedback('');setSessionSummary('');deferred.current=[];}}/></View>
    </>)}
    {progress&&!locked&&reviewSummary&&<View>
      <Text style={s.heading}>Repasos disponibles</Text>
      <Text style={s.muted}>{reviewSummary.due} ejercicios pendientes · {reviewSummary.overdue} anteriores a hoy · {reviewSummary.completedLessons} lecciones completadas</Text>
      {reviewQueue.length>0&&<Action label="Practicar el primer repaso" onPress={()=>{
        const entry=reviewQueue[0];if(!entry)return;
        playbackEpoch.current++;mic.stop();void stopCuratedVoice();setSpeaking(false);
        setChosenId(entry.lesson.id);setStep(entry.lesson.exercises.findIndex(e=>e.id===entry.exercise.id));setReviewExerciseId(entry.exercise.id);
        setActive(true);setPassed(false);setAnswer('');setFeedback('');setRequestedDetail('');setSessionSummary('');deferred.current=[];
      }}/>}
      {reviewQueue.length===0&&<Text style={s.muted}>No hay repasos vencidos. Puedes continuar el curso a tu ritmo.</Text>}
      {progress.completed.length>0&&<View style={s.row}>{lessons.filter(l=>progress.completed.includes(l.id)).map(l=><Action key={'review-'+l.id} label={'Repasar '+l.focusTag} onPress={()=>{
        const entries=voluntaryCourseReview(progress,l.id);const first=entries[0];if(!first)return;
        playbackEpoch.current++;mic.stop();void stopCuratedVoice();setSpeaking(false);
        setChosenId(l.id);setStep(l.exercises.findIndex(e=>e.id===first.exercise.id));setReviewExerciseId(first.exercise.id);setActive(true);setPassed(false);setAnswer('');setFeedback('');setRequestedDetail('');setSessionSummary('');deferred.current=[];
      }}/>)}</View>}
    </View>}
    {progress&&!locked&&<View style={s.row}>{lessons.map(l=><Action key={l.id} label={`${l.band}: ${l.focusTag}${progress.completed.includes(l.id)?' ✓':''}`} onPress={()=>{
      if(courseLessonStatus(progress,l)==='locked'){setFeedback('Primero completa la lección anterior.');return;}
      playbackEpoch.current++;setChosenId(l.id);setReviewExerciseId(null);setStep(0);setActive(false);setPassed(false);setAnswer('');setFeedback('');setRequestedDetail('');setSessionSummary('');deferred.current=[];mic.stop();void stopCuratedVoice();
    }}/>)}</View>}
    <Text style={s.note}>Se guarda progreso local sin audio ni transcripciones. Reconocimiento limitado al primer plano, al idioma y modelos instalados; no hay audio de fondo garantizado. La síntesis de voz del sistema tampoco está verificada sin Internet. Falta probar en hardware y cifrar datos sensibles.</Text>
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" style={s.btn} onPress={onPress}><Text style={s.btnTxt}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:11,marginTop:12},kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700',letterSpacing:1.2},heading:{fontSize:20,color:'#F2F7FC',fontWeight:'700'},muted:{fontSize:13,color:'#A6BBD0',lineHeight:20},stage:{color:'#89D4C5',fontSize:13,fontWeight:'700'},phrase:{color:'#F3DFC1',fontSize:18,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},btn:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,paddingVertical:12,paddingHorizontal:15,minHeight:44},btnTxt:{color:'#F2F7FC',fontWeight:'700',fontSize:12},input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:55,color:'#F2F7FC',fontSize:15},warning:{color:'#FFE19C',fontSize:12,lineHeight:18},note:{color:'#A6BBD0',fontSize:11,lineHeight:17}});
