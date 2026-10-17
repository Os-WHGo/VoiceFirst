/** Offline-first curated dialogue practice with resumable progress and on-device ASR.
 * - No remote transcription or generative model is invoked here.
 * - The native ASR plugin REQUIRES an iOS/Android development build; Expo Go may lack it.
 * - On-device capability and locale depend on the OS/device and may require installed models.
 * - Background/locked-screen capture is not claimed or enabled in this prototype.
 * - Transcript matching is NOT pronunciation, CEFR or complete semantic assessment.
 */
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,TextInput,StyleSheet,AppState,Platform} from 'react-native';
import * as Speech from 'expo-speech';
import {selectGuidedDialogues,newDialogueRun,dialogueAudioCue,evaluateDialogueTurn,
  getSavedDialogueRun,newLearningProgress,chooseDialogue,saveDialogueAttempt,startDialogueReview,
  makeProgressWriter,type DialogueAttempt,type LocalLearningProgress,type TargetLanguage,type LearningFocus,
  type GuidedDialogue,type CorrectionTiming,type InstructionFormat,audioCueForDialogue,answerAudioCuesForDialogue} from '@voicefirst/core';
import {loadLocalProgress,storeSerializedLocalProgress} from './progress-storage';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';

type Subscription={remove:()=>void};
type NativeASR={
  isRecognitionAvailable:()=>boolean;supportsOnDeviceRecognition:()=>boolean;
  requestMicrophonePermissionsAsync:()=>Promise<{granted:boolean}>;
  addListener:(event:string,fn:(data:any)=>void)=>Subscription;
  start:(opts:{lang:string;requiresOnDeviceRecognition:boolean;interimResults:boolean;continuous:boolean;maxAlternatives:number})=>void;
  stop:()=>void;abort:()=>void;
  androidTriggerOfflineModelDownload?:(opts:{locale:string})=>Promise<{status:string}>;
};
function getRecognizer():NativeASR|null {
  try { // Loaded only when needed, gracefully disable when the native module is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api=require('expo-speech-recognition').ExpoSpeechRecognitionModule as NativeASR;
    return api && api.isRecognitionAvailable()&&api.supportsOnDeviceRecognition() ? api:null;
  }catch{return null;}
}
const speechLocale:Record<TargetLanguage,string>={'en-CA':'en-CA','fr-CA':'fr-CA',es:'es-ES','pt-BR':'pt-BR',de:'de-DE',it:'it-IT'};
const localDay=()=>{const now=new Date(),year=now.getFullYear();return `${year}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;};

export function GuidedDialoguePractice({nativeLanguage,target,focus,rate=0.88,correctionTiming='after-each-answer',instructionFormat='full-context'}:{
  nativeLanguage:TargetLanguage;target:TargetLanguage;focus:LearningFocus;rate?:number;
  correctionTiming?:CorrectionTiming;instructionFormat?:InstructionFormat;
}){
  const selection=useMemo(()=>selectGuidedDialogues(target,focus,'adult'),[target,focus]);
  const dialogues=selection.dialogues;
  const [progress,setProgress]=useState<LocalLearningProgress|null>(null);
  const [storageError,setStorageError]=useState('');
  const [dialogueId,setDialogueId]=useState<string|null>(null);
  const [draft,setDraft]=useState('');
  const [feedback,setFeedback]=useState('');
  const [pendingSuggestion,setPendingSuggestion]=useState('');
  const [showSupport,setShowSupport]=useState(false);
  const [showExamples,setShowExamples]=useState(false);
  const [recognizer,setRecognizer]=useState<NativeASR|null>(null);
  const [listening,setListening]=useState(false);
  const [handsFree,setHandsFree]=useState(false);
  const [latestSpeech,setLatestSpeech]=useState('');
  const [canInstallModel,setCanInstallModel]=useState(false);
  const captureRef=useRef<{id:string;turn:string}|null>(null);
  const busyRef=useRef(false);
  const mounted=useRef(true);
  const progressRef=useRef<LocalLearningProgress|null>(null);
  const autoNextRef=useRef(false);
  const writer=useMemo(()=>makeProgressWriter(raw=>storeSerializedLocalProgress(target,raw)),[target]);
  const dialogue=dialogues.find(x=>x.id===dialogueId)??dialogues[0]??null;
  const run=progress&&dialogue?getSavedDialogueRun(progress,dialogue):null;
  const turn=run&&dialogue?dialogue.turns[run.turnIndex]:undefined;

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
      const unfinishedPrevious=previous && !p.dialogues[previous.id]?.run.completed ? previous : undefined;
      setDialogueId(overdue ? selected!.id : unfinishedPrevious?.id??selected?.id??null);
    });
    return()=>{valid=false;mounted.current=false;};
  },[target]); // interest changes only ordering, never erases per-language progress
  useEffect(()=>{setRecognizer(getRecognizer());setCanInstallModel(Platform.OS==='android');},[]);
  useEffect(()=>()=>{void stopCuratedVoice();try{recognizer?.abort();}catch{}},[recognizer]);

  const stopListening=useCallback(()=>{
    captureRef.current=null;busyRef.current=false;setListening(false);
    try{recognizer?.abort();}catch{}
  },[recognizer]);
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

  const beginRecognition=useCallback(async()=>{
    if(!recognizer||!dialogue||!turn||!progress||storageError){setFeedback('Reconocimiento local no disponible. Puedes continuar con el campo de texto.');return;}
    if(busyRef.current)return;
    try{
      const permission=await recognizer.requestMicrophonePermissionsAsync();
      if(!permission.granted){setFeedback('Se necesita permiso de micrófono para practicar hablando.');return;}
      captureRef.current={id:dialogue.id,turn:turn.id};
      busyRef.current=true;setListening(true);setLatestSpeech('');setDraft('');
      recognizer.start({lang:speechLocale[target],requiresOnDeviceRecognition:true,interimResults:true,continuous:false,maxAlternatives:1});
    }catch{
      captureRef.current=null;busyRef.current=false;setListening(false);
      setFeedback('Este idioma necesita un modelo de reconocimiento local compatible. No se envió audio a Internet.');
    }
  },[recognizer,dialogue,turn,progress,storageError,target]);
  const startVoiceLesson=async()=>{if(!recognizer){setHandsFree(false);setFeedback('Se necesita un modelo de reconocimiento local antes de iniciar el modo continuo.');return;}setHandsFree(true);speak(false,()=>void beginRecognition());};
  useEffect(()=>{
    if(!recognizer)return;
    const subscriptions:Subscription[]=[
      recognizer.addListener('result',(event)=>{
        const captured=captureRef.current;
        if(!captured||captured.id!==dialogue?.id||captured.turn!==turn?.id)return;
        const spoken=event.results?.[0]?.transcript?.trim();
        if(typeof spoken!=='string'||!spoken)return;
        setDraft(spoken);setLatestSpeech(spoken);
        if(!event.isFinal)return;
        captureRef.current=null;busyRef.current=false;setListening(false);
        const confidence=event.results?.[0]?.confidence;
        // Unknown/low ASR certainty is never recorded as failure or success.
        if(typeof confidence!=='number'||confidence<0.75){
          setFeedback('Escuché esta frase, pero no tengo suficiente certeza. Revisa el texto y confirma manualmente.');return;
        }
        const outcome=evaluateDialogueTurn(turn,spoken,target,'high');
        applyAttempt(outcome,dialogue!);
        const suggestion=outcome.verdict==='accepted'?'Respuesta reconocida.':'No coincide con los ejemplos revisados; podría ser una alternativa válida. Puedes revisar las respuestas modelo.';
        if(correctionTiming==='on-request'){setPendingSuggestion(suggestion);setFeedback('Respuesta registrada. La sugerencia está disponible cuando la pidas.');}
        else if(correctionTiming==='after-exercise'&&outcome.verdict==='accepted'){setFeedback('Respuesta registrada, continuemos.');setPendingSuggestion(suggestion);}
        else setFeedback(suggestion);
        if(outcome.verdict==='accepted'&&handsFree){
          autoNextRef.current=true;setLatestSpeech('');
        }
      }),
      recognizer.addListener('error',()=>{captureRef.current=null;busyRef.current=false;setListening(false);setFeedback('No se pudo reconocer localmente. Prueba de nuevo o utiliza texto; no se enviará audio fuera del dispositivo.');}),
      recognizer.addListener('end',()=>{busyRef.current=false;setListening(false);}),
    ];
    return()=>subscriptions.forEach(s=>s.remove());
  },[recognizer,dialogue,turn,target,applyAttempt,handsFree,correctionTiming]);

  // Continue the next authored question after the previous accepted voice turn.
  // This is foreground-only; uncertain or unmatched ASR never auto-advances.
  useEffect(()=>{
    if(!autoNextRef.current||!run||!dialogue)return;
    autoNextRef.current=false;
    if(run.completed){setHandsFree(false);Speech.speak('Práctica terminada. Puedes elegir otra situación.',{language:'es-ES',rate});return;}
    speak(false,()=>void beginRecognition());
  },[run?.turnIndex,run?.completed,dialogue?.id,speak,beginRecognition]);

  const verifyTyped=()=>{
    if(!turn||!dialogue||!draft.trim())return;
    stopListening();
    const outcome=evaluateDialogueTurn(turn,draft,target,'high'); // explicitly user-confirmed transcript, not a phonetic score
    applyAttempt(outcome,dialogue);
    const suggestion=outcome.verdict==='accepted'?'Respuesta admitida para este ejercicio.':'Puede ser una expresión válida que nuestro catálogo todavía no contempla. Puedes revisar los ejemplos.';
    if(correctionTiming==='on-request'){setPendingSuggestion(suggestion);setFeedback('Respuesta guardada. Puedes pedir una sugerencia cuando quieras.');}
    else if(correctionTiming==='after-exercise'&&outcome.verdict==='accepted'){setPendingSuggestion(suggestion);setFeedback('Respuesta guardada.');}
    else setFeedback(suggestion);
    if(outcome.verdict==='accepted'){setDraft('');setShowExamples(false);}
  };
  const changeDialogue=(id:string)=>{
    stopListening();void stopCuratedVoice();autoNextRef.current=false;setHandsFree(false);
    setDialogueId(id);setDraft('');setFeedback('');setShowExamples(false);setPendingSuggestion('');setShowSupport(false);
  };
  const repeatCompleted=()=>{
    if(!progress||!dialogue)return;
    const next=startDialogueReview(progress,dialogue);
    progressRef.current=next;setProgress(next);void writer(next).catch(()=>setStorageError('No se pudo guardar el repaso.'));
    setDraft('');setFeedback('');setShowExamples(false);
  };
  const downloadOfflineModel=async()=>{
    if(!recognizer?.androidTriggerOfflineModelDownload)return;
    try{const r=await recognizer.androidTriggerOfflineModelDownload({locale:speechLocale[target]});setFeedback(`Estado de descarga local: ${r.status}. Comprueba el paquete antes de practicar.`);}
    catch {setFeedback('Este dispositivo no pudo abrir la descarga del modelo local.');}
  };
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
        <Action label={listening?'Detener micrófono':'Responder con mi voz (offline)'} onPress={()=>listening?stopListening():void beginRecognition()}/>
        <Action label="Escuchar y responder" onPress={()=>void startVoiceLesson()}/>
      </View>
      {!recognizer?<Text style={s.warning}>Reconocimiento offline no disponible aquí. Necesita compilación nativa y modelos del dispositivo; el texto sigue disponible.</Text>:null}
      {!!recognizer&&canInstallModel?<Action label="Instalar modelo local (Android)" onPress={()=>void downloadOfflineModel()}/>:null}
      <TextInput style={s.input} multiline value={draft} onChangeText={setDraft} placeholder="Respuesta escrita o transcripción local, sin enviar a servidores" placeholderTextColor="#899FB0" autoCorrect={false}/>
      <View style={s.row}>
        <Action label="Confirmar respuesta" onPress={verifyTyped}/>
        <Action label={showExamples?'Ocultar alternativas':'Ver respuestas modelo'} onPress={()=>setShowExamples(v=>!v)}/>
      </View>
      {showExamples&&<Text style={s.hint}>{turn?.acceptedReplies.join(' · ')}</Text>}
      {!!latestSpeech && <Text style={s.sub}>Transcripción local: {latestSpeech}</Text>}
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
