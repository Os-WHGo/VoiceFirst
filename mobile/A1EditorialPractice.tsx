/** Internal A1 editorial-only review, never included in public course navigation. */
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Pressable,Text,TextInput,View} from 'react-native';
import {a1EditorialSceneTopics,startA1EditorialReview,currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,a1EditorialReviewTranscript,a1EditorialAuthoredTypedExamples,a1EditorialListeningTurns,type A1EditorialListeningTurn,type A1EditorialReviewState,type TargetLanguage} from '@voicefirst/core';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
import {loadA1LocalReviewManifest,reviewA1LocalAudio} from './a1-editorial-local-audio';
import {createA1EditorialExpoPlayer} from './a1-editorial-native-player';
export function A1EditorialPractice({known,target,rate}:{known:TargetLanguage;target:TargetLanguage;rate:number}){
 const [topic,setTopic]=useState(a1EditorialSceneTopics[0]!);
 const [state,setState]=useState<A1EditorialReviewState|null>(null);
 const [answerText,setAnswerText]=useState('');
 const [feedback,setFeedback]=useState('');
 const [showTranscript,setShowTranscript]=useState(false);
 const [showVariants,setShowVariants]=useState(false);
 const request=useRef(0);
 const localPlayer=useMemo(createA1EditorialExpoPlayer,[]);
 const [localPlayingTurn,setLocalPlayingTurn]=useState<string|null>(null);
 const [playingTurn,setPlayingTurn]=useState<string|null>(null);
 const [speechStatus,setSpeechStatus]=useState('');
 const [localAudioStatus,setLocalAudioStatus]=useState('');
 const stopAudio=useCallback(()=>{
  request.current++;
  localPlayer.stop();
  setPlayingTurn(null);
  setLocalPlayingTurn(null);
  void stopCuratedVoice();
 },[localPlayer]);
 useEffect(()=>{
  const subscription=AppState.addEventListener('change',next=>{
   if(next!=='active'){stopAudio();setSpeechStatus('Escucha detenida al salir de la aplicación.');}
  });
  return()=>subscription.remove();
 },[stopAudio]);
 useEffect(()=>{
  stopAudio();
  setSpeechStatus('');setLocalAudioStatus('');
  setState(startA1EditorialReview(known,target,topic));
  setAnswerText('');setFeedback('');setShowTranscript(false);setShowVariants(false);
  return()=>{request.current++;localPlayer.stop();void stopCuratedVoice();};
 },[known,target,topic,stopAudio]);
 const step=currentA1EditorialReview(state);
 const transcript=a1EditorialReviewTranscript(state);
 const examples=a1EditorialAuthoredTypedExamples(state);
 const listening=a1EditorialListeningTurns(state);
 const playTurn=(turn:A1EditorialListeningTurn)=>{
  const token=++request.current;
  setPlayingTurn(turn.audioId);
  setSpeechStatus('Ensayo con voz del sistema; funcionamiento sin red no certificado.');
  // Explicit tap only, foreground only, and never evaluates this audio as mastery.
  void playCuratedVoice(turn.cue,rate,
   ()=>{if(token===request.current){setPlayingTurn(null);setSpeechStatus('Turno reproducido, sin evaluación.');}},
   error=>{if(token===request.current){setPlayingTurn(null);setSpeechStatus(error);}});
 };
 const playOriginalTurn=(turn:A1EditorialListeningTurn)=>{
  if(!transcript)return;
  stopAudio();
  const token=++request.current;
  const sceneId=transcript.sceneId;
  setLocalPlayingTurn(turn.audioId);
  setLocalAudioStatus('Verificando de nuevo las seis grabaciones originales A1…');
  void loadA1LocalReviewManifest(sceneId).then(async loaded=>{
   if(token!==request.current)return;
   if(loaded.kind!=='candidate'){
    setLocalAudioStatus(loaded.reason);
    setLocalPlayingTurn(null);
    return;
   }
   const out=await localPlayer.play(sceneId,turn.audioId,loaded.manifest,rate);
   if(token!==request.current)return;
   setLocalPlayingTurn(null);
   setLocalAudioStatus(out.status==='completed'?
    'Grabación original local escuchada. Sin puntuación, licencias ni nivel aprobados.':
    out.status==='unavailable'?
    'Falta audio local válido o alguna de las seis grabaciones no pasó SHA-256/PCM. No se usará TTS como sustituto.':
    out.status==='cancelled'?'Reproducción original detenida.':
    out.status==='timeout'?'Se superó la duración máxima del clip local.':
    'No se pudo reproducir el audio original.');
  }).catch(()=>{
   if(token===request.current){
    setLocalPlayingTurn(null);
    setLocalAudioStatus('Error al verificar la grabación original; no se reprodujo.');
   }
  });
 };
 const submit=(response:{kind:'choice';optionId:string}|{kind:'typed';text:string}|{kind:'skip'})=>{
  stopAudio();
  const out=submitA1EditorialReview(state,response);
  if(out){setState(out.state);setFeedback(out.feedback);setAnswerText('');}
 };
 return <View>
  <Text>Ensayo editorial A1. Sin audio, puntuación ni progreso.</Text>
  {transcript&&<View>
   <Pressable accessibilityRole="button" onPress={()=>{
    stopAudio();
    const token=++request.current;
    setLocalAudioStatus('Verificando seis archivos privados; no se publicarán.');
    void reviewA1LocalAudio(transcript.sceneId).then(report=>{
     if(request.current===token)setLocalAudioStatus(report.reason);
    });
   }}><Text>Comprobar grabaciones A1 originales (interno)</Text></Pressable>
   {!!localAudioStatus&&<Text accessibilityRole="alert">{localAudioStatus}</Text>}
   <Pressable accessibilityRole="button" accessibilityLabel="Ver u ocultar diálogo completo" onPress={()=>{stopAudio();setShowTranscript(v=>!v);}}>
    <Text>{showTranscript?'Ocultar diálogo':'Ver diálogo de seis turnos'}</Text>
   </Pressable>
   {showTranscript&&<View>
    <Text>Guion sin grabaciones aprobadas. Reproducción opcional con TTS de sistema, solo para el equipo editorial. No garantiza uso offline ni calidad de voz.</Text>
    {transcript.turns.map((t,i)=><View key={t.id}>
     <Text>{t.speaker.toUpperCase()}: {t.text}</Text>
     {listening?.[i]&&<>
      <Pressable accessibilityRole="button" onPress={()=>playTurn(listening[i]!)}>
       <Text>{playingTurn===t.audioId?'Reproduciendo TTS…':'Escuchar este turno con TTS'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>playOriginalTurn(listening[i]!)}>
       <Text>{localPlayingTurn===t.audioId?'Verificando/reproduciendo grabación…':'Verificar y escuchar grabación local original'}</Text>
      </Pressable>
     </>}
    </View>)}
    {(playingTurn!==null||localPlayingTurn!==null)&&<Pressable accessibilityRole="button" onPress={()=>{stopAudio();setSpeechStatus('Reproducción detenida.');setLocalAudioStatus('Reproducción detenida.');}}><Text>Detener audio</Text></Pressable>}
    {!!speechStatus&&<Text accessibilityRole="alert">{speechStatus}</Text>}
   </View>}
  </View>}
  {a1EditorialSceneTopics.map(id=><Pressable key={id} onPress={()=>setTopic(id)}><Text>{id}</Text></Pressable>)}
  {step?.kind==='question'&&<View>
   <Text>{step.question}</Text>
   {step.options.map(o=><Pressable key={o.id} accessibilityRole="button" onPress={()=>submit({kind:'choice',optionId:o.id})}><Text>{o.text}</Text></Pressable>)}
   {examples!==null&&examples.length>0&&<View>
    <Pressable accessibilityRole="button" onPress={()=>setShowVariants(v=>!v)}><Text>{showVariants?'Ocultar variantes':'Ver variantes autoradas para revisión'}</Text></Pressable>
    {showVariants&&examples.map((example,i)=><Text key={i}>{example}</Text>)}
   </View>}
   <TextInput value={answerText} onChangeText={setAnswerText} placeholder="Respuesta opcional" maxLength={240} accessibilityLabel="Respuesta escrita para ensayo A1"/>
   <Pressable onPress={()=>submit({kind:'typed',text:answerText})}><Text>Revisar texto</Text></Pressable>
   <Pressable onPress={()=>submit({kind:'skip'})}><Text>Omitir</Text></Pressable>
   <Text>{feedback}</Text>
   {step.revealedEvidence&&<Text>{step.revealedEvidence}</Text>}
   <Pressable onPress={()=>setState(s=>advanceA1EditorialReview(s,'reveal'))}><Text>Mostrar evidencia</Text></Pressable>
   {state?.phase==='feedback'&&<Pressable accessibilityRole="button" onPress={()=>{stopAudio();setState(s=>advanceA1EditorialReview(s,'next'));setFeedback('');setShowVariants(false);}}><Text>Siguiente</Text></Pressable>}
  </View>}
  {step?.kind==='complete'&&<Text>Fin. No se guardaron respuestas.</Text>}
 </View>;
}
