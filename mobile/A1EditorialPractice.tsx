/** Internal A1 editorial-only review, never included in public course navigation. */
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Pressable,Text,TextInput,View} from 'react-native';
import {a1EditorialSceneTopics,startA1EditorialReview,currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,a1EditorialReviewTranscript,a1EditorialAuthoredTypedExamples,a1EditorialListeningTurns,type A1EditorialListeningTurn,type A1EditorialReviewState,type TargetLanguage} from '@voicefirst/core';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
export function A1EditorialPractice({known,target,rate}:{known:TargetLanguage;target:TargetLanguage;rate:number}){
 const [topic,setTopic]=useState(a1EditorialSceneTopics[0]!);
 const [state,setState]=useState<A1EditorialReviewState|null>(null);
 const [answerText,setAnswerText]=useState('');
 const [feedback,setFeedback]=useState('');
 const [showTranscript,setShowTranscript]=useState(false);
 const [showVariants,setShowVariants]=useState(false);
 const request=useRef(0);
 const [playingTurn,setPlayingTurn]=useState<string|null>(null);
 const [speechStatus,setSpeechStatus]=useState('');
 const stopAudio=useCallback(()=>{
  request.current++;
  setPlayingTurn(null);
  void stopCuratedVoice();
 },[]);
 useEffect(()=>{
  const subscription=AppState.addEventListener('change',next=>{
   if(next!=='active'){stopAudio();setSpeechStatus('Escucha detenida al salir de la aplicación.');}
  });
  return()=>subscription.remove();
 },[stopAudio]);
 useEffect(()=>{
  stopAudio();
  setSpeechStatus('');
  setState(startA1EditorialReview(known,target,topic));
  setAnswerText('');setFeedback('');setShowTranscript(false);setShowVariants(false);
  return()=>{request.current++;void stopCuratedVoice();};
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
 const submit=(response:{kind:'choice';optionId:string}|{kind:'typed';text:string}|{kind:'skip'})=>{
  stopAudio();
  const out=submitA1EditorialReview(state,response);
  if(out){setState(out.state);setFeedback(out.feedback);setAnswerText('');}
 };
 return <View>
  <Text>Ensayo editorial A1. Sin audio, puntuación ni progreso.</Text>
  {transcript&&<View>
   <Pressable accessibilityRole="button" accessibilityLabel="Ver u ocultar diálogo completo" onPress={()=>{stopAudio();setShowTranscript(v=>!v);}}>
    <Text>{showTranscript?'Ocultar diálogo':'Ver diálogo de seis turnos'}</Text>
   </Pressable>
   {showTranscript&&<View>
    <Text>Guion sin grabaciones aprobadas. Reproducción opcional con TTS de sistema, solo para el equipo editorial. No garantiza uso offline ni calidad de voz.</Text>
    {transcript.turns.map((t,i)=><View key={t.id}>
     <Text>{t.speaker.toUpperCase()}: {t.text}</Text>
     {listening?.[i]&&<Pressable accessibilityRole="button" onPress={()=>playTurn(listening[i]!)}><Text>{playingTurn===t.audioId?'Reproduciendo…':'Escuchar este turno con TTS'}</Text></Pressable>}
    </View>)}
    {playingTurn!==null&&<Pressable accessibilityRole="button" onPress={()=>{stopAudio();setSpeechStatus('Reproducción detenida.');}}><Text>Detener audio</Text></Pressable>}
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
