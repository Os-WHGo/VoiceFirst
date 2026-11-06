/** Internal A1 editorial-only review, never included in public course navigation. */
import React,{useEffect,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {a1EditorialSceneTopics,startA1EditorialReview,currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,a1EditorialReviewTranscript,a1EditorialAuthoredTypedExamples,type A1EditorialReviewState,type TargetLanguage} from '@voicefirst/core';
export function A1EditorialPractice({known,target}:{known:TargetLanguage;target:TargetLanguage}){
 const [topic,setTopic]=useState(a1EditorialSceneTopics[0]!);
 const [state,setState]=useState<A1EditorialReviewState|null>(null);
 const [answerText,setAnswerText]=useState('');
 const [feedback,setFeedback]=useState('');
 const [showTranscript,setShowTranscript]=useState(false);
 const [showVariants,setShowVariants]=useState(false);
 useEffect(()=>{setState(startA1EditorialReview(known,target,topic));setAnswerText('');setFeedback('');setShowTranscript(false);setShowVariants(false);},[known,target,topic]);
 const step=currentA1EditorialReview(state);
 const transcript=a1EditorialReviewTranscript(state);
 const examples=a1EditorialAuthoredTypedExamples(state);
 const submit=(response:{kind:'choice';optionId:string}|{kind:'typed';text:string}|{kind:'skip'})=>{
  const out=submitA1EditorialReview(state,response);
  if(out){setState(out.state);setFeedback(out.feedback);setAnswerText('');}
 };
 return <View>
  <Text>Ensayo editorial A1. Sin audio, puntuación ni progreso.</Text>
  {transcript&&<View>
   <Pressable accessibilityRole="button" accessibilityLabel="Ver u ocultar diálogo completo" onPress={()=>setShowTranscript(v=>!v)}>
    <Text>{showTranscript?'Ocultar diálogo':'Ver diálogo de seis turnos'}</Text>
   </Pressable>
   {showTranscript&&<View>
    <Text>Guion pendiente de revisión y grabación. No hay audio disponible.</Text>
    {transcript.turns.map(t=><Text key={t.id}>{t.speaker.toUpperCase()}: {t.text}</Text>)}
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
   {state?.phase==='feedback'&&<Pressable accessibilityRole="button" onPress={()=>{setState(s=>advanceA1EditorialReview(s,'next'));setFeedback('');setShowVariants(false);}}><Text>Siguiente</Text></Pressable>}
  </View>}
  {step?.kind==='complete'&&<Text>Fin. No se guardaron respuestas.</Text>}
 </View>;
}
