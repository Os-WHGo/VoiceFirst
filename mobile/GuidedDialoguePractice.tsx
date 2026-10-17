/** Offline-first curated dialogue practice with resumable progress and on-device ASR.
 * - No remote transcription or generative model is invoked here.
 * - The native ASR plugin REQUIRES an iOS/Android development build; Expo Go may lack it.
 * - On-device capability and locale depend on the OS/device and may require installed models.
 * - Background/locked-screen capture is not claimed or enabled in this prototype.
 * - Transcript matching is NOT pronunciation, CEFR or complete semantic assessment.
 */
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,TextInput,StyleSheet,AppState} from 'react-native';
import * as Speech from 'expo-speech';
import {selectGuidedDialogues,newDialogueRun,dialogueAudioCue,evaluateDialogueTurn,
  getSavedDialogueRun,newLearningProgress,chooseDialogue,saveDialogueAttempt,startDialogueReview,
  decideTutorFeedback,tutorFeedbackForLanguage,makeProgressWriter,type DialogueAttempt,type LocalLearningProgress,type TargetLanguage,type LearningFocus,
  type GuidedDialogue,type ExperiencePreferences,defaultExperiencePreferences,audioCueForDialogue,answerAudioCuesForDialogue,currentVoiceTurn,voiceTranscriptDisposition} from '@voicefirst/core';
import {loadLocalProgress,storeSerializedLocalProgress} from './progress-storage';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
import {useOnDeviceAnswer,type DictationResult} from './use-on-device-answer';

const localDay=()=>{const now=new Date(),year=now.getFullYear();return `${year}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;};
const finishedSpeech:Record<TargetLanguage,string>={
 'en-CA':'Practice finished. You can choose another situation.',
 'fr-CA':'Exercice terminé. Vous pouvez choisir une autre situation.',
 es:'Práctica terminada. Puedes elegir otra situación.',
 'pt-BR':'Prática concluída. Você pode escolher outra situação.',
 de:'Übung abgeschlossen. Du kannst eine weitere Situation wählen.',
 it:'Esercizio completato. Puoi scegliere un’altra situazione.'
};

export function GuidedDialoguePractice({nativeLanguage,target,focus,rate=0.88,experience=defaultExperiencePreferences}:{
  nativeLanguage:TargetLanguage;target:TargetLanguage;focus:LearningFocus;rate?:number;
  experience?:ExperiencePreferences;
}){
  const {correctionTiming,instructionFormat}=experience;
  const selection=useMemo(()=>selectGuidedDialogues(target,focus,'adult'),[target,focus]);
  const dialogues=selection.dialogues;
  const [progress,setProgress]=useState<LocalLearningProgress|null>(null);
  const [storageError,setStorageError]=useState('');
  const [dialogueId,setDialogueId]=useState<string|null>(null);
  const [draft,setDraft]=useState('');
  const [feedback,setFeedback]=useState('');
  const [pendingSuggestion,setPendingSuggestion]=useState('');
  const [deferredCorrections,setDeferredCorrections]=useState<string[]>([]);
  const [showSupport,setShowSupport]=useState(false);
  const [showExamples,setShowExamples]=useState(false);
  const [handsFree,setHandsFree]=useState(false);
  const [latestSpeech,setLatestSpeech]=useState('');
  const voiceEpoch=useRef(0);
  const onFinal=useRef<(r:DictationResult,id:string)=>void>(()=>undefined);
  const onPartial=useRef<(text:string,id:string)=>void>(()=>undefined);
  const mounted=useRef(true);
  const progressRef=useRef<LocalLearningProgress|null>(null);
  const autoNextRef=useRef(false);
  const writer=useMemo(()=>makeProgressWriter(raw=>storeSerializedLocalProgress(target,raw)),[target]);
  const dialogue=dialogues.find(x=>x.id===dialogueId)??dialogues[0]??null;
  const run=progress&&dialogue?getSavedDialogueRun(progress,dialogue):null;
  const turn=run&&dialogue?dialogue.turns[run.turnIndex]:undefined;
  const mic=useOnDeviceAnswer(target,(r,id)=>onFinal.current(r,id),(text,id)=>onPartial.current(text,id));

  useEffect(()=>{
    mounted.current=true;progressRef.current=null;autoNextRef.current=false;setProgress(null);setStorageError('');setFeedback('');setDraft('');setHandsFree(false);
    let valid=true;
    void loadLocalProgress(target).then(result=>{
      if(!valid)return;
      if(result.kind==='blocked'){setStorageError(result.reason);return;}
      const p=result.value;progressRef.current=p;setProgress(p);
      const selected=chooseDialogue(p,dialogues,localDay());
      const previous=p.lastDialogueId ? dialogues.find(d=>d.id===p.lastDialogueId) : undefined;
      const overdue=selected && p.dialogues[selected.id]?.run.completed && p.dialogues[selected.id]?.reviewDueOn && p.dialogues[selected.id]?.reviewDueOn!<=localDay();
      const unfinishedPrevious=experience.returnToLastStep && previous && !p.dialogues[previous.id]?.run.completed ? previous : undefined;
      setDialogueId(overdue ? selected!.id : unfinishedPrevious?.id??selected?.id??null);
    });
    return()=>{valid=false;mounted.current=false;};
  },[target]); // interest changes only ordering, never erases per-language progress
  useEffect(()=>()=>{void stopCuratedVoice();},[]);
  const stopListening=useCallback(()=>{voiceEpoch.current++;mic.stop();},[mic.stop]);
  // Do not keep an unexpected microphone open after the app leaves foreground;
  // background audio and lock screen will need explicit OS-specific tests and consent.
  useEffect(()=>{
    const sub=AppState.addEventListener('change',state=>{
      if(state!=='active'){stopListening();setHandsFree(false);void stopCuratedVoice();}
    });
    return()=>sub.remove();
  },[stopListening]);

  const applyAttempt=useCallback((attempt:DialogueAttempt,d:GuidedDialogue)=>{
    const previous=progressRef.current;
    if(!previous||previous.target!==d.target)return;
    const next=saveDialogueAttempt(previous,d,attempt,localDay());
    if(next!==previous){
      progressRef.current=next;setProgress(next);
      void writer(next).catch(()=>{if(mounted.current){setStorageError('No se pudo guardar el avance. Detuve la práctica para evitar perder datos.');setHandsFree(false);}});
    }
  },[writer]);

  const speak=useCallback((hint=false,onDone?:()=>void)=>{
    if(!dialogue||!run||run.completed)return;
    const cue=dialogueAudioCue(dialogue,run.turnIndex,nativeLanguage,hint);
    if(!cue)return;
    if(!hint && turn){
      const authored=audioCueForDialogue(dialogue.id,turn.id);
      if(authored){void playCuratedVoice(authored,rate,onDone,message=>setFeedback(message));return;}
    }
    void stopCuratedVoice();
    Speech.speak(cue.text,{language:cue.language,rate,onDone,onError:()=>setFeedback('La voz seleccionada no está disponible en este dispositivo.')});
  },[dialogue,run,turn,nativeLanguage,rate]);
  const speakModelAnswer=()=>{
    if(!dialogue||!turn)return;
    const model=answerAudioCuesForDialogue(dialogue.id,turn.id)[0];
    if(model)void playCuratedVoice(model,rate,undefined,message=>setFeedback(message));
  };

  const beginRecognition=useCallback(async():Promise<boolean>=>{
    if(!dialogue||!turn||!progress||storageError){setFeedback('La práctica local no está disponible. Puedes escribir tu respuesta.');return false;}
    const ok=await mic.start(`${dialogue.id}:${turn.id}`);
    if(!ok)setFeedback('No se pudo abrir el micrófono local. Puedes responder por escrito.');
    return ok;
  },[dialogue,turn,progress,storageError,mic.start]);
  const startVoiceLesson=()=>{
    if(!mic.available){setHandsFree(false);setFeedback('Necesitas un modelo de reconocimiento local instalado antes de empezar.');return;}
    const token=++voiceEpoch.current;
    setHandsFree(true);
    speak(false,()=>{if(voiceEpoch.current===token&&mounted.current)void beginRecognition();});
  };
  onPartial.current=(text,id)=>{
    if(!currentVoiceTurn(dialogue&&turn?`${dialogue.id}:${turn.id}`:null,id,!storageError))return;
    setDraft(text);setLatestSpeech(text);
  };
  onFinal.current=(result,id)=>{
    if(!currentVoiceTurn(dialogue&&turn?`${dialogue.id}:${turn.id}`:null,id,!storageError))return;
    const spoken=result.text;
    setDraft(spoken);setLatestSpeech(spoken);
    const disposition=voiceTranscriptDisposition({text:spoken,confidence:result.confidence,answerControl:experience.answerControl,final:true});
    if(disposition==='ignore')return;
    if(disposition==='confirm'){
      setHandsFree(false);
      setFeedback(result.confidence==='unknown'
        ?'El reconocimiento no fue suficientemente fiable. Corrige o confirma la frase sin penalización.'
        :'Texto reconocido. Revisa y pulsa «Confirmar respuesta» para evaluar el ejemplo.');
      return;
    }
    const outcome=evaluateDialogueTurn(turn!,spoken,target,'high');
    const tutor=decideTutorFeedback(turn!,outcome,run?.attempts[turn!.id]??0);
    applyAttempt(outcome,dialogue!);
    const suggestion=outcome.verdict==='accepted'?'Respuesta reconocida dentro del catálogo.':'La frase podría ser válida, pero no coincide con nuestras respuestas de ejemplo.';
    if(correctionTiming==='on-request'){setPendingSuggestion(suggestion);setFeedback('Respuesta registrada; explicación disponible cuando la pidas.');}
    else if(correctionTiming==='after-exercise'){
      setDeferredCorrections(old=>[...old,suggestion].slice(-15));
      setFeedback(outcome.verdict==='accepted'?'Respuesta aceptada.':'No coincide todavía con las respuestas de ejemplo. Puedes volver a intentarlo.');
    }else setFeedback(tutorFeedbackForLanguage(tutor,nativeLanguage)+' '+suggestion);
    if(outcome.verdict==='accepted'&&handsFree&&experience.answerControl==='auto-after-silence'){
      autoNextRef.current=true;setLatestSpeech('');
    }
  };

  // Continue the next authored question after the previous accepted voice turn.
  // This is foreground-only; uncertain or unmatched ASR never auto-advances.
  useEffect(()=>{
    if(!autoNextRef.current||!run||!dialogue)return;
    autoNextRef.current=false;
    if(run.completed){setHandsFree(false);Speech.speak(finishedSpeech[nativeLanguage],{language:nativeLanguage,rate});return;}
    speak(false,()=>void beginRecognition());
  },[run?.turnIndex,run?.completed,dialogue?.id,speak,beginRecognition]);

  const verifyTyped=()=>{
    if(!turn||!dialogue||!draft.trim())return;
    stopListening();
    const outcome=evaluateDialogueTurn(turn,draft,target,'high'); // explicitly user-confirmed transcript, not a phonetic score
    const guidance=decideTutorFeedback(turn,outcome,run?.attempts[turn.id]??0);
    applyAttempt(outcome,dialogue);
    const suggestion=outcome.verdict==='accepted'?'Respuesta admitida para este ejercicio.':'Puede ser una expresión válida que nuestro catálogo todavía no contempla. Puedes revisar los ejemplos.';
    if(correctionTiming==='on-request'){setPendingSuggestion(suggestion);setFeedback('Respuesta guardada. Puedes pedir una sugerencia cuando quieras.');}
    else if(correctionTiming==='after-exercise'){
      setDeferredCorrections(old=>[...old,suggestion].slice(-15));
      setFeedback(outcome.verdict==='accepted'?'Respuesta guardada.':'No se ha aceptado esa variante todavía. Puedes reintentar.');
    }else setFeedback(suggestion);
    if(outcome.verdict==='accepted'){setDraft('');setShowExamples(false);}
  };
  const changeDialogue=(id:string)=>{
    stopListening();void stopCuratedVoice();autoNextRef.current=false;setHandsFree(false);
    setDialogueId(id);setDraft('');setFeedback('');setShowExamples(false);setPendingSuggestion('');setDeferredCorrections([]);setShowSupport(false);
  };
  const repeatCompleted=()=>{
    if(!progress||!dialogue)return;
    const next=startDialogueReview(progress,dialogue);
    progressRef.current=next;setProgress(next);void writer(next).catch(()=>setStorageError('No se pudo guardar el repaso.'));
    setDraft('');setFeedback('');setShowExamples(false);setPendingSuggestion('');setDeferredCorrections([]);
  };
  const downloadOfflineModel=async()=>{await mic.downloadModel();};
  if(!dialogue)return null;
  return <View style={s.wrap}>
    <Text style={s.kicker}>CURSO ESTRUCTURADO · DIÁLOGO · SIN API EXTERNA</Text>
    <Text style={s.title}>Practica contestando, no traduciendo</Text>
    {storageError?<Text style={s.warning}>{storageError}</Text>:null}
    {!progress && !storageError?<Text style={s.sub}>Abriendo progreso guardado…</Text>:null}
    <Text style={s.sub}>{dialogue.label[nativeLanguage]} · {dialogue.level} · {progress?.dialogues[dialogue.id]?.completions??0} prácticas completadas</Text>
    {progress && run ? (run.completed ? <>
      <Text style={s.success}>¡Completaste las preguntas de esta situación!</Text>
      <Text style={s.sub}>Próximo repaso: {progress.dialogues[dialogue.id]?.reviewDueOn??'pendiente'}. No equivale a dominar el nivel MCER.</Text>
      {correctionTiming==='after-exercise'&&deferredCorrections.length>0&&<Text style={s.sub}>Correcciones del ejercicio: {deferredCorrections.join(' · ')}</Text>}
      {correctionTiming==='on-request'&&!!pendingSuggestion&&<Action label="Mostrar explicación" onPress={()=>{setFeedback(pendingSuggestion);setPendingSuggestion('');}}/>}
      {!!feedback&&<Text style={s.sub}>{feedback}</Text>}
      <Action label="Repetir esta situación" onPress={repeatCompleted}/>
    </>:<>
      <Text style={s.step}>Pregunta {run.turnIndex+1}/{dialogue.turns.length}</Text>
      <Text style={s.question}>{turn?.teacherCue}</Text>
      {(instructionFormat==='full-context'||showSupport)&&<Text style={s.sub}>{turn?.support[nativeLanguage]}</Text>}
      {instructionFormat==='one-step'&&<Action label={showSupport?'Ocultar contexto':'Mostrar contexto en mi idioma'} onPress={()=>setShowSupport(v=>!v)}/>}
      <View style={s.row}>
        <Action label="Escuchar pregunta" onPress={()=>speak(false)}/>
        <Action label="Ayuda en mi idioma" onPress={()=>speak(true)}/>
        <Action label="Escuchar respuesta modelo" onPress={speakModelAnswer}/>
      </View>
      <View style={s.row}>
        <Action label={mic.listening?'Detener micrófono':'Responder con mi voz (offline)'} onPress={()=>mic.listening?stopListening():void beginRecognition()}/>
        <Action label="Escuchar y responder" onPress={()=>void startVoiceLesson()}/>
      </View>
      {!mic.available?<Text style={s.warning}>Reconocimiento offline no disponible aquí. Necesita compilación nativa y modelos del dispositivo; el texto sigue disponible.</Text>:null}
      {mic.canDownload?<Action label="Instalar modelo local (Android)" onPress={()=>void downloadOfflineModel()}/>:null}
      <TextInput style={s.input} multiline value={draft} onChangeText={setDraft} placeholder="Respuesta escrita o transcripción local, sin enviar a servidores" placeholderTextColor="#899FB0" autoCorrect={false}/>
      <View style={s.row}>
        <Action label="Confirmar respuesta" onPress={verifyTyped}/>
        <Action label={showExamples?'Ocultar alternativas':'Ver respuestas modelo'} onPress={()=>setShowExamples(v=>!v)}/>
      </View>
      {showExamples&&<Text style={s.hint}>{turn?.acceptedReplies.join(' · ')}</Text>}
      {experience.subtitles && !!latestSpeech && <Text style={s.sub}>Transcripción local: {latestSpeech}</Text>}
      {mic.model==='missing'&&<Text style={s.warning}>Este idioma necesita instalar un modelo local para responder hablando.</Text>}
      {mic.model==='installed'&&<Text style={s.sub}>El sistema informa un modelo local instalado; funcionamiento real pendiente de verificar.</Text>}
      {!!mic.issue && <Text style={s.warning}>{mic.issue}</Text>}
      {mic.canDownload&&<Action label={mic.checkingModel?'Revisando modelos…':'Revisar modelo local'} onPress={()=>void mic.checkModel()}/>}
      {!!feedback&&<Text style={s.sub}>{feedback}</Text>}
      {!!pendingSuggestion&&<Action label="Mostrar sugerencia" onPress={()=>{setFeedback(pendingSuggestion);setPendingSuggestion('');}}/>}
    </>):null}
    <Text style={s.step}>Otras situaciones y repasos</Text>
    <View style={s.row}>{dialogues.map(d=><Action key={d.id} label={`${d.domain==='foundation'?'Vida diaria':d.domain==='work'?'Trabajo':'Viajes'}${(progress?.dialogues[d.id]?.run.completed?' ✓':'')}`} onPress={()=>changeDialogue(d.id)}/>)}</View>
    <Text style={s.note}>Avance guardado en SQLite local, sin guardar audio ni transcripciones. El ASR del sistema solo se activa si está disponible sin red; los mensajes con baja confianza no puntúan. La selección de TTS aquí no garantiza voces instaladas offline, y el sistema puede usar sus propios servicios. Bluetooth y pantalla bloqueada aún necesitan pruebas físicas. Este prototipo está dirigido a adultos; acceso infantil pendiente de aprobación.</Text>
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void;key?:string}){return <Pressable accessibilityRole="button" style={s.button} onPress={onPress}><Text style={s.buttonText}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{borderColor:'#2B435A',borderWidth:1,borderRadius:18,backgroundColor:'#142339',padding:18,gap:11,marginTop:12},
  kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700'},title:{fontSize:19,fontWeight:'700',color:'#F2F7FC'},sub:{fontSize:13,color:'#A6BBD0',lineHeight:19},step:{color:'#89D4C5',fontWeight:'700'},question:{color:'#F3DFC1',fontSize:18,lineHeight:25,fontWeight:'700'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:9},button:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,padding:11,minHeight:44},buttonText:{color:'#F2F7FC',fontWeight:'700',fontSize:12},
  input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:63,color:'#F2F7FC',fontSize:15},hint:{color:'#F3DFC1',fontSize:12,lineHeight:21},success:{color:'#89D4C5',fontSize:16},warning:{color:'#FFE19C',fontSize:12,lineHeight:18},note:{fontSize:11,color:'#A6BBD0',lineHeight:17}});
